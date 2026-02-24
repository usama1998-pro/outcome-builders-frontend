export default interface Notes {
    id: number;
    uuid?: string | null;
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
    // Owner info
    owner_name?: string;
    owner_email?: string;
}

export interface NoteMember {
    id: number;
    user_id: number;
    note_id: number;
    role: string;
    user_email?: string;
    user_name?: string;
}