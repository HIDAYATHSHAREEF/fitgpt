import React, { useState, useEffect } from 'react';
import { Onboarding } from './components/Onboarding';
import { ChatInterface } from './components/ChatInterface';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { ChatHistory } from './components/ChatHistory';
import { UserProfile, ProgressEntry, AppView, ChatSession, ChatMessage } from './types';
import { MessageSquare, LayoutDashboard, Settings, History, LogOut, Loader2 } from 'lucide-react';
import { db } from './services/db';

// Mock initial data to avoid empty charts for new users
const MOCK_INITIAL_HISTORY = (startWeight: number): ProgressEntry[] => {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  
  return dates.map((date, i) => ({
    date,
    weight: startWeight + (Math.random() * 0.5 - 0.25), // slight fluctuation
    caloriesBurned: i % 2 === 0 ? 300 + Math.floor(Math.random() * 200) : 0,
    workoutCompleted: i % 2 === 0
  }));
};

const App: React.FC = () => {
  const [appLoading, setAppLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [progressData, setProgressData] = useState<ProgressEntry[]>([]);
  
  // Chat History Management
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Initial Load
  useEffect(() => {
    const initApp = async () => {
      try {
        const email = await db.auth.getSession();
        if (email) {
          setIsAuthenticated(true);
          setUserEmail(email);

          // Load user data in parallel
          const [loadedProfile, loadedProgress, loadedSessions] = await Promise.all([
            db.user.getProfile(),
            db.progress.getAll(),
            db.chats.getAll()
          ]);

          setSessions(loadedSessions);

          if (loadedProfile) {
            setProfile(loadedProfile);
            setProgressData(loadedProgress);
            
            // Determine initial view
            if (loadedSessions.length > 0) {
              setView(AppView.DASHBOARD);
            } else {
              await createNewSession();
              setView(AppView.CHAT);
            }
          } else {
            setView(AppView.ONBOARDING);
          }
        } else {
          setView(AppView.LOGIN);
        }
      } catch (error) {
        console.error("Failed to initialize app:", error);
      } finally {
        setAppLoading(false);
      }
    };
    initApp();
  }, []);


  const createNewSession = async () => {
    const newSession: ChatSession = {
        id: Date.now().toString(),
        title: 'New Conversation',
        createdAt: Date.now(),
        messages: []
    };
    
    // Optimistic update
    setSessions(prev => [...prev, newSession]);
    setCurrentSessionId(newSession.id);
    
    // Async save
    await db.chats.create(newSession);
    return newSession.id;
  };

  const handleLogin = async (email: string) => {
    setAppLoading(true);
    await db.auth.signIn(email);
    setIsAuthenticated(true);
    setUserEmail(email);
    
    const profile = await db.user.getProfile();
    if (profile) {
      setProfile(profile);
      const progress = await db.progress.getAll();
      setProgressData(progress);
      const sessions = await db.chats.getAll();
      setSessions(sessions);
      setView(AppView.DASHBOARD);
    } else {
      setView(AppView.ONBOARDING);
    }
    setAppLoading(false);
  };

  const handleLogout = async () => {
    await db.auth.signOut();
    setIsAuthenticated(false);
    setUserEmail('');
    setProfile(null);
    setProgressData([]);
    setSessions([]);
    setView(AppView.LOGIN);
  };

  const handleOnboardingComplete = async (data: UserProfile) => {
    setAppLoading(true);
    await db.user.upsertProfile(data);
    setProfile(data);
    
    const initialProgress = MOCK_INITIAL_HISTORY(data.weight);
    await db.progress.setInitialHistory(initialProgress);
    setProgressData(initialProgress);
    
    await createNewSession();
    setView(AppView.CHAT);
    setAppLoading(false);
  };

  const handleAddProgress = async (entry: ProgressEntry) => {
    const updated = await db.progress.upsert(entry);
    setProgressData(updated);
  };

  const handleChatUpdate = async (updatedMessages: ChatMessage[]) => {
      if (!currentSessionId) return;
      
      // Update local state immediately for responsiveness
      const activeSession = sessions.find(s => s.id === currentSessionId);
      if (!activeSession) return;

      let title = activeSession.title;
      // Generate a title based on the first user message if it's "New Conversation"
      if (activeSession.title === 'New Conversation' && updatedMessages.length > 1) {
          const firstUserMsg = updatedMessages.find(m => m.role === 'user');
          if (firstUserMsg) {
              title = firstUserMsg.text.slice(0, 30) + (firstUserMsg.text.length > 30 ? '...' : '');
          }
      }

      const updatedSessions = sessions.map(session => 
          session.id === currentSessionId 
          ? { ...session, messages: updatedMessages, title } 
          : session
      );
      setSessions(updatedSessions);

      // Async save to DB
      await db.chats.update(currentSessionId, { messages: updatedMessages, title });
  };
  
  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      // Optimistic update
      const newSessions = sessions.filter(s => s.id !== id);
      setSessions(newSessions);
      
      if (currentSessionId === id) {
          setCurrentSessionId(null);
      }
      
      // Async DB call
      await db.chats.delete(id);
  };

  const activeSession = sessions.find(s => s.id === currentSessionId);

  if (appLoading) {
      return (
        <div className="h-screen w-full flex items-center justify-center bg-fitness-dark text-fitness-primary">
            <Loader2 className="animate-spin" size={48} />
        </div>
      );
  }

  // Render Login View
  if (!isAuthenticated || view === AppView.LOGIN) {
    return <Login onLogin={handleLogin} />;
  }

  // Render Onboarding View
  if (view === AppView.ONBOARDING) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Render Main App
  return (
    <div className="flex h-screen w-full bg-fitness-dark text-slate-100 font-sans overflow-hidden">
      {/* Mobile-first Navigation */}
      <nav className="fixed bottom-0 w-full h-16 bg-fitness-card border-t border-gray-800 z-40 md:relative md:w-20 md:h-full md:border-t-0 md:border-r md:flex-col md:justify-start md:pt-8 flex justify-around items-center">
        <button
          onClick={() => setView(AppView.CHAT)}
          className={`p-3 rounded-xl transition-all ${
            view === AppView.CHAT 
            ? 'text-fitness-primary bg-fitness-primary/10' 
            : 'text-gray-400 hover:text-white'
          }`}
          title="Chat"
        >
          <MessageSquare size={24} />
        </button>
        
        <button
          onClick={() => setView(AppView.HISTORY)}
          className={`p-3 rounded-xl transition-all ${
            view === AppView.HISTORY 
            ? 'text-fitness-primary bg-fitness-primary/10' 
            : 'text-gray-400 hover:text-white'
          }`}
          title="History"
        >
          <History size={24} />
        </button>

        <button
          onClick={() => setView(AppView.DASHBOARD)}
          className={`p-3 rounded-xl transition-all ${
            view === AppView.DASHBOARD 
            ? 'text-fitness-secondary bg-fitness-secondary/10' 
            : 'text-gray-400 hover:text-white'
          }`}
          title="Dashboard"
        >
          <LayoutDashboard size={24} />
        </button>
        
        <div className="md:mt-auto md:pb-8 flex flex-col gap-4">
             <button onClick={handleLogout} className="p-3 rounded-xl text-gray-600 hover:text-red-400 transition-colors" title="Logout">
                <LogOut size={24} />
            </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col h-[calc(100vh-64px)] md:h-screen">
        
        {view === AppView.CHAT && profile && (
            // Key is important here to force remount when session changes
            <ChatInterface 
                key={currentSessionId || 'new'} 
                userProfile={profile} 
                initialMessages={activeSession?.messages || []}
                latestStats={progressData[progressData.length - 1]} 
                onUpdateMessages={handleChatUpdate}
            />
        )}

        {view === AppView.HISTORY && (
            <ChatHistory 
                sessions={sessions}
                currentSessionId={currentSessionId}
                onSelectSession={(id) => {
                    setCurrentSessionId(id);
                    setView(AppView.CHAT);
                }}
                onNewChat={async () => {
                    await createNewSession();
                    setView(AppView.CHAT);
                }}
                onDeleteSession={handleDeleteSession}
            />
        )}

        {view === AppView.DASHBOARD && profile && (
          <Dashboard 
            profile={profile} 
            progressData={progressData} 
            onAddEntry={handleAddProgress}
          />
        )}
      </main>
    </div>
  );
};

export default App;