export type ViewType = 'members' | 'view' | 'chat' | 'about';
  
export interface Message {
    id: string;
    content: string;
    userId: string;
    username: string;
    createdAt: string;
    showTimeBreak?: boolean;
    readBy: string[];
}
  
export interface TypingUser {
    userId: string;
    username: string;
    lastTyped: number;
}