export default interface Notes {
    id: number;
    title: string;
    createdAt: string;
    createdBy: string;
    fileName?: string | null;
    fileSize?: number | null;
    fileType?: string | null;
    hasFile?: boolean;
}