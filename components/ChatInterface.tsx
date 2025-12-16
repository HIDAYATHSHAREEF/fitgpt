import React, { useEffect, useRef, useState } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { ChatMessage, UserProfile, ProgressEntry } from '../types';
import { startChatSession, sendMessageStream, mapMessagesToContent } from '../services/geminiService';
import { Chat, GenerateContentResponse } from "@google/genai";
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  userProfile: UserProfile;
  initialMessages: ChatMessage[];
  latestStats?: ProgressEntry;
  onUpdateMessages: (messages: ChatMessage[]) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
    userProfile, 
    initialMessages, 
    latestStats,
    onUpdateMessages
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Chat Session
  useEffect(() => {
    const initChat = async () => {
        try {
            // Convert existing messages to history format
            const history = mapMessagesToContent(messages);
            const session = startChatSession(userProfile, history);
            setChatSession(session);
            
            // If new chat (empty), add greeting
            if (messages.length === 0) {
                const initialGreeting: ChatMessage = {
                    id: 'init-1',
                    role: 'model',
                    text: `Hi ${userProfile.name}! I'm FitBot. I see you're looking to focus on **${userProfile.goal.replace('_', ' ')}**. How can I help you today? Need a workout plan or diet tips?`,
                    timestamp: Date.now()
                };
                const newMessages = [initialGreeting];
                setMessages(newMessages);
                onUpdateMessages(newMessages);
            }
        } catch (e) {
            console.error("Failed to init chat", e);
        }
    };
    initChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || !chatSession || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    onUpdateMessages(newMessages); // Save to parent immediately
    setInput('');
    setIsLoading(true);

    try {
        const streamResult = await sendMessageStream(chatSession, input);
        
        let fullResponse = '';
        const botMsgId = (Date.now() + 1).toString();
        
        // Optimistic update for bot message
        setMessages(prev => [...prev, {
            id: botMsgId,
            role: 'model',
            text: '',
            timestamp: Date.now()
        }]);

        for await (const chunk of streamResult) {
            const chunkText = (chunk as GenerateContentResponse).text || '';
            fullResponse += chunkText;
            
            setMessages(prev => {
                const updated = prev.map(msg => 
                    msg.id === botMsgId ? { ...msg, text: fullResponse } : msg
                );
                // We typically wait until stream ends to save to parent to avoid perf hits, 
                // but for simplicity we can just update local state here and save at the end.
                return updated;
            });
        }

        // Final save to parent with complete message
        onUpdateMessages([...newMessages, {
            id: botMsgId,
            role: 'model',
            text: fullResponse,
            timestamp: Date.now()
        }]);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: "Sorry, I'm having trouble connecting right now. Please check your internet or API key.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
      onUpdateMessages([...newMessages, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    "Give me a 20-min workout",
    "High protein vegetarian meal?",
    "How to improve my squat form?",
    "I missed my workout yesterday"
  ];

  return (
    <div className="flex flex-col h-full bg-fitness-dark">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-fitness-secondary' : 'bg-fitness-primary'
              }`}
            >
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div
              className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-fitness-secondary/20 text-white border border-fitness-secondary/30 rounded-tr-sm'
                  : 'bg-fitness-card text-gray-200 border border-gray-700 rounded-tl-sm'
              }`}
            >
              <ReactMarkdown 
                components={{
                    ul: ({node, ...props}) => <ul className="list-disc ml-4 my-2" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal ml-4 my-2" {...props} />,
                    strong: ({node, ...props}) => <strong className="text-fitness-primary font-semibold" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-lg font-bold text-white mt-2 mb-1" {...props} />
                }}
              >
                {msg.text}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
             <div className="w-8 h-8 rounded-full bg-fitness-primary flex items-center justify-center">
                <Bot size={16} />
             </div>
             <div className="bg-fitness-card p-4 rounded-2xl rounded-tl-sm border border-gray-700">
                <Loader2 className="animate-spin text-fitness-primary" size={20} />
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions (only if empty or few messages) */}
      {messages.length < 3 && (
        <div className="px-4 pb-2">
            <p className="text-xs text-fitness-muted mb-2 font-medium uppercase tracking-wider">Suggested Actions</p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {suggestions.map((s, i) => (
                    <button 
                        key={i} 
                        onClick={() => { setInput(s); }} 
                        className="whitespace-nowrap bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-xs py-2 px-3 rounded-full transition-colors"
                    >
                        {s}
                    </button>
                ))}
            </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-fitness-dark border-t border-gray-800">
        <div className="relative flex items-end gap-2 bg-fitness-card p-2 rounded-xl border border-gray-700 focus-within:border-fitness-primary transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask FitBot anything..."
            className="w-full bg-transparent text-white placeholder-gray-500 text-sm resize-none outline-none max-h-32 min-h-[44px] py-3 px-2"
            rows={1}
            style={{ height: 'auto', minHeight: '44px' }}
            onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-2 rounded-lg mb-1 flex-shrink-0 transition-all ${
              input.trim() && !isLoading
                ? 'bg-fitness-primary text-white hover:scale-105'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};