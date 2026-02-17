export interface ChatTab {
    id: number;
    name: string;
    tenant_id: number;
    user_id: number;
    created_at: string;
    updated_at: string;
}

export interface ChatMessage {
    id: number;
    chat_tab_id: number;
    question: string;
    answer: string | null;
    created_at: string;
    updated_at: string;
}

export interface ChatHistory {
    chat_tab: ChatTab;
    messages: ChatMessage[];
}

export interface StreamEvent {
    type: 'start' | 'chunk' | 'complete' | 'stop' | 'error' | 'status';
    content?: string;
    message_id?: number;
    chat_tab_id?: number;
    stream_id?: string;
    error?: string;
    status?: string;  // Status message like "Searching knowledge base..."
    step?: string;    // Step identifier like "searching_kb", "generating", etc.
}