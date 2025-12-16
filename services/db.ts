import { UserProfile, ProgressEntry, ChatSession } from '../types';

const STORAGE_KEYS = {
  PROFILE: 'fitbot_profile',
  PROGRESS: 'fitbot_progress',
  SESSIONS: 'fitbot_sessions',
  AUTH: 'fitbot_auth'
};

/**
 * Data Access Layer
 * Currently uses LocalStorage, but designed to return Promises.
 * This makes swapping to Supabase later strictly a change within this file.
 */
export const db = {
  auth: {
    async getSession(): Promise<string | null> {
      // Future Supabase: await supabase.auth.getSession()
      return localStorage.getItem(STORAGE_KEYS.AUTH);
    },
    async signIn(email: string): Promise<{ user: { email: string } }> {
      // Future Supabase: await supabase.auth.signInWithPassword(...)
      localStorage.setItem(STORAGE_KEYS.AUTH, email);
      return { user: { email } };
    },
    async signOut(): Promise<void> {
      // Future Supabase: await supabase.auth.signOut()
      localStorage.removeItem(STORAGE_KEYS.AUTH);
    }
  },

  user: {
    async getProfile(): Promise<UserProfile | null> {
      // Future Supabase: await supabase.from('profiles').select('*').single()
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return data ? JSON.parse(data) : null;
    },
    async upsertProfile(profile: UserProfile): Promise<UserProfile> {
      // Future Supabase: await supabase.from('profiles').upsert(profile)
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
      return profile;
    }
  },

  progress: {
    async getAll(): Promise<ProgressEntry[]> {
      // Future Supabase: await supabase.from('progress_entries').select('*').order('date')
      const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      return data ? JSON.parse(data) : [];
    },
    async upsert(entry: ProgressEntry): Promise<ProgressEntry[]> {
      // Future Supabase: await supabase.from('progress_entries').upsert(entry)
      const current = await this.getAll();
      const index = current.findIndex(p => p.date === entry.date);
      let updated;
      if (index >= 0) {
        updated = [...current];
        updated[index] = entry;
      } else {
        updated = [...current, entry];
      }
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(updated));
      return updated;
    },
    async setInitialHistory(entries: ProgressEntry[]): Promise<void> {
       localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(entries));
    }
  },

  chats: {
    async getAll(): Promise<ChatSession[]> {
      // Future Supabase: await supabase.from('chat_sessions').select('*, messages(*)')
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return data ? JSON.parse(data) : [];
    },
    async create(session: ChatSession): Promise<ChatSession> {
      // Future Supabase: await supabase.from('chat_sessions').insert(session)
      const current = await this.getAll();
      const updated = [...current, session];
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updated));
      return session;
    },
    async update(sessionId: string, updates: Partial<ChatSession>): Promise<ChatSession | undefined> {
      // Future Supabase: await supabase.from('chat_sessions').update(updates).eq('id', sessionId)
      const current = await this.getAll();
      const updated = current.map(s => s.id === sessionId ? { ...s, ...updates } : s);
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updated));
      return updated.find(s => s.id === sessionId);
    },
    async delete(sessionId: string): Promise<void> {
      // Future Supabase: await supabase.from('chat_sessions').delete().eq('id', sessionId)
      const current = await this.getAll();
      const updated = current.filter(s => s.id !== sessionId);
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updated));
    }
  }
};