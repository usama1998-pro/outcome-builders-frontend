export interface ChatTab{
    id: string;
    name: string;
    lastMessage: string;
    updatedAt: string;
}


export interface ChatMessage {
    id: string;
    chatId: string;
    sender: 'user' | 'bot';
    content: string;
    timestamp: string;
}