export interface SocialMediaLinks {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  github?: string;
  youtube?: string;
}

export interface RegisterOrganizationPayload {
  company_name: string;
  description?: string;
  logo?: string;
  images?: string[];
  social_media?: SocialMediaLinks;
  is_active?: boolean;
  owner_role?: string;
  user_id?: number;
}

export interface RegisterOrganizationResponse {
  tenant_id: number;
  tenant: string;
  schema: string;
  token: string;
}

export interface OrganizationDetails {
  id: number;
  company_name: string;
  description?: string;
  logo?: string;
  images?: string[];
  is_active: boolean;
  total_users?: number;
  owner_name?: string;
  owner_email?: string;
  admins?: Admin[];
  social_media?: SocialMediaLinks;
  created_at?: string;
}

export interface Admin {
  id: number;
  name: string;
  email: string;
  role: string;
}
