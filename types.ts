export interface UserProfile {
  name: string;
  age: number;
  weight: number; // kg
  height: number; // cm
  goal: 'weight_loss' | 'muscle_gain' | 'endurance' | 'general_fitness';
  experience: 'beginner' | 'intermediate' | 'advanced';
  equipment: 'gym' | 'home_dumbbells' | 'bodyweight' | 'resistance_bands';
}

export interface ProgressEntry {
  date: string;
  weight: number;
  caloriesBurned?: number;
  workoutCompleted: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
}

export enum AppView {
  LOGIN = 'LOGIN',
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  CHAT = 'CHAT',
  HISTORY = 'HISTORY'
}