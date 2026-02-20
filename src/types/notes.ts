export default interface Notes {
    id: number;
    title: string;
    createdAt: string;
    createdBy: string;
    fileName?: string | null;
    fileSize?: number | null;
    fileType?: string | null;
    hasFile?: boolean;
    is_trained?: boolean;
    is_pinned?: boolean;
    visibility?: "private" | "public" | "shared";
    user_id?: number;
    is_owner?: boolean;
}

export interface NoteMember {
    id: number;
    user_id: number;
    note_id: number;
    role: string;
    user_email?: string;
    user_name?: string;
}