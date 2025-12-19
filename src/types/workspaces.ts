export interface TenantInfo {
    id: number;
    company_name: string;
}

export interface WorkSpaceList {
    id: number;
    title: string;
    createdAt: string;
    createdBy: string;
    description: string;
    members: number;
    avatarUrl: string;
    tenantId: number;
    tenant: TenantInfo;
}