export default interface Collections {
    id: number;
    uuid?: string | null;
    title: string;
    description: string;
    createdAt: string;
    createdBy: string;
    members: number;
    avatarUrl: string;
    workspaceId: number;
    workspaceName: string;
    visibility?: string;
}