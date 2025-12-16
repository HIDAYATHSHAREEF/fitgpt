import React from 'react';
import { ChatSession } from '../types';
import { MessageSquare, Plus, Clock, ChevronRight, Trash2 } from 'lucide-react';

interface ChatHistoryProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({ 
  sessions, 
  currentSessionId, 
  onSelectSession, 
  onNewChat,
  onDeleteSession
}) => {
  
  // Group sessions by date could be added here later (Today, Yesterday, etc.)

  return (
    <div className="flex flex-col h-full bg-fitness-dark p-4 md:p-6">
      <header className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-white">History</h2>
            <p className="text-sm text-fitness-muted">Your training conversations</p>
        </div>
        <button 
          onClick={onNewChat}
          className="flex items-center gap-2 bg-fitness-primary hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-fitness-primary/20"
        >
          <Plus size={20} />
          <span className="hidden md:inline">New Chat</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto space-y-3">
        {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-fitness-muted">
                <MessageSquare size={48} className="mb-4 opacity-20" />
                <p>No chat history yet.</p>
                <button onClick={onNewChat} className="text-fitness-primary mt-2 hover:underline">Start a new chat</button>
            </div>
        ) : (
            sessions.slice().reverse().map((session) => (
            <div 
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`group relative flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                currentSessionId === session.id 
                    ? 'bg-fitness-primary/10 border-fitness-primary/50' 
                    : 'bg-fitness-card border-gray-700 hover:border-gray-500'
                }`}
            >
                <div className="flex items-center gap-4 overflow-hidden">
                    <div className={`p-2 rounded-lg ${currentSessionId === session.id ? 'bg-fitness-primary text-white' : 'bg-gray-800 text-gray-400'}`}>
                        <MessageSquare size={20} />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-white font-medium truncate pr-4">{session.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock size={12} />
                            {new Date(session.createdAt).toLocaleDateString()}
                            <span>•</span>
                            {session.messages.length} messages
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={(e) => onDeleteSession(e, session.id)}
                        className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete chat"
                    >
                        <Trash2 size={18} />
                    </button>
                    <ChevronRight size={18} className="text-gray-600" />
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );
};