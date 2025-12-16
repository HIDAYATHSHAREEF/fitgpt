import { GoogleGenAI, Chat, Content } from "@google/genai";
import { UserProfile, ProgressEntry, ChatMessage } from "../types";

// Safe access to process.env for browser environments
const API_KEY = (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : '';

let client: GoogleGenAI | null = null;

export const getClient = (): GoogleGenAI => {
  if (!client) {
    if (!API_KEY) {
      console.warn("API Key is missing. The chatbot may not function correctly without it.");
    }
    client = new GoogleGenAI({ apiKey: API_KEY });
  }
  return client;
};

export const createSystemInstruction = (profile: UserProfile, latestStats?: ProgressEntry): string => {
  return `
You are FitBot, an elite AI personal trainer and nutritionist. 
Your tone is motivating, friendly, and professional. 

User Profile:
- Name: ${profile.name}
- Age: ${profile.age}
- Weight: ${profile.weight}kg
- Height: ${profile.height}cm
- Goal: ${profile.goal.replace('_', ' ')}
- Experience Level: ${profile.experience}
- Available Equipment: ${profile.equipment.replace('_', ' ')}

${latestStats ? `Current Status (as of ${latestStats.date}):
- Weight: ${latestStats.weight}kg
- Last Workout Completed: ${latestStats.workoutCompleted ? 'Yes' : 'No'}
` : ''}

Your Responsibilities:
1. Create personalized workout plans based on the user's equipment and experience.
2. Suggest diet tips and approximate calorie/macro breakdowns (remind them these are estimates).
3. Answer fitness questions accurately.
4. If the user reports pain or dizziness, immediately advise them to stop and consult a professional.
5. Always remind users to warm up and cool down.

Format your responses using Markdown. Use lists, bold text, and clear headings.
Keep responses concise but informative.
`;
};

// Helper to convert UI messages to Gemini Content format
export const mapMessagesToContent = (messages: ChatMessage[]): Content[] => {
  return messages.map(m => ({
    role: m.role,
    parts: [{ text: m.text }]
  }));
};

export const startChatSession = (profile: UserProfile, history: Content[] = []) => {
  const ai = getClient();
  const systemInstruction = createSystemInstruction(profile);
  
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    history: history,
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.7, // Balance between creativity and consistency
    }
  });
};

export const sendMessageStream = async (chat: Chat, message: string) => {
  return await chat.sendMessageStream({ message });
};