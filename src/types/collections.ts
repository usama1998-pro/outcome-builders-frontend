export default interface Collections {
    id: number;
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