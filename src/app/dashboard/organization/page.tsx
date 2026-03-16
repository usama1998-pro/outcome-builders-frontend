"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Crown, Shield, ImageIcon, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/src/store/useAuth";
import { useOrganizationDetails } from "@/src/hooks/useOrganization";
import BlocksLoader from "@/src/components/Loaders/BlocksLoader/BlocksLoader";
import RequireAuth from "@/src/components/auth/requireAuth";
import { FaInstagram, FaLinkedin, FaTwitter, FaGithub, FaFacebook, FaYoutube } from "react-icons/fa";
import { useUserPermissions, PERMISSIONS } from "@/src/hooks/useUserPermissions";

export default function OrganizationPage() {
    const currentTenantId = useAuthStore((s) => s.tenantId);
    const { data: organization, isLoading, isError, error } = useOrganizationDetails(currentTenantId || 0);
    
    // Permission checks - hide manage button until permissions are loaded and confirmed
    const { hasPermission, isOwnerOrAdmin, isLoading: permissionsLoading } = useUserPermissions();
    
    // Only show manage button if user has permission to manage users
    const canManageUsers = !permissionsLoading && (
        hasPermission(PERMISSIONS.ADMIN_MANAGE) || 
        hasPermission(PERMISSIONS.USER_INVITE) || 
        isOwnerOrAdmin
    );

    if (isLoading) {
        return (
            <RequireAuth>
                <div className="w-full h-full flex items-center justify-center p-5">
                    <BlocksLoader />
                </div>
            </RequireAuth>
        );
    }

    if (isError || !organization) {
        return (
            <RequireAuth>
                <div className="w-full h-full flex items-center justify-center p-5">
                    <Card className="w-[400px] border-red-500 text-red-800">
                        <CardHeader className="border-b border-red-800">
                            <CardTitle className="text-lg font-semibold text-red-700">Error</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <p>{error?.message || "Failed to load organization details."}</p>
                        </CardContent>
                    </Card>
                </div>
            </RequireAuth>
        );
    }

    return (
        <RequireAuth>
            <div className="w-full h-full flex flex-col items-center p-6 gap-6">
                {/* Header */}
                <div className="w-full border-b-2 border-dashed pb-4">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Building2 className="h-8 w-8 text-[#DB2B30]" />
                        Organization Details
                    </h1>
                </div>

                <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Organization Info Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-[#DB2B30]" />
                                Organization Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Logo */}
                            <div className="flex items-center justify-center py-4">
                                <Avatar className="w-32 h-32">
                                    <AvatarImage src={organization.logo || ""} alt={organization.company_name} />
                                    <AvatarFallback className="text-4xl">
                                        {organization.company_name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </div>

                            {/* Organization Name */}
                            <div>
                                <p className="text-sm text-muted-foreground">Organization Name</p>
                                <p className="text-xl font-semibold">{organization.company_name}</p>
                            </div>

                            {/* Description */}
                            <div>
                                <p className="text-sm text-muted-foreground">Description</p>
                                <p className="text-sm">
                                    {organization.description || "No description available."}
                                </p>
                            </div>

                            {/* Status */}
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <Badge variant={organization.is_active ? "default" : "secondary"}>
                                    {organization.is_active ? "Active" : "Inactive"}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Members Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-[#DB2B30]" />
                                Members & Roles
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Total Users */}
                            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-[#DB2B30]" />
                                    <span className="font-medium">Total Users</span>
                                </div>
                                <span className="text-2xl font-bold">{organization.total_users || 0}</span>
                            </div>

                            {/* Owner */}
                            <div>
                                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                                    <Crown className="h-4 w-4 text-[#DB2B30]" />
                                    Owner
                                </p>
                                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                    <Avatar>
                                        <AvatarImage src="" alt={organization.owner_name || "Owner"} />
                                        <AvatarFallback>
                                            {organization.owner_name?.charAt(0).toUpperCase() || "O"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{organization.owner_name || "Unknown"}</p>
                                        <p className="text-xs text-muted-foreground">{organization.owner_email || ""}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Team Members */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Users className="h-4 w-4 text-[#DB2B30]" />
                                        Team Members ({organization.admins?.length || 0})
                                    </p>
                                    {canManageUsers && (
                                        <Link href="/dashboard/admins">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-xs border-[#DB2B30] text-[#DB2B30] hover:bg-[#DB2B30]/10"
                                            >
                                                <Settings className="h-3 w-3 mr-1" />
                                                Manage
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {organization.admins && organization.admins.length > 0 ? (
                                        organization.admins.map((member, index) => {
                                            const isAdmin = member.role.toLowerCase() === "admin";
                                            return (
                                                <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                                    <Avatar>
                                                        <AvatarImage src="" alt={member.name} />
                                                        <AvatarFallback>
                                                            {member.name.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <p className="font-medium">{member.name}</p>
                                                        <p className="text-xs text-muted-foreground">{member.email}</p>
                                                    </div>
                                                    <Badge 
                                                        variant="secondary"
                                                        className={isAdmin ? "bg-rose-500/10 text-rose-600" : "bg-emerald-500/10 text-emerald-600"}
                                                    >
                                                        {member.role}
                                                    </Badge>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">No team members assigned.</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Images/Gallery Card (Full Width) */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ImageIcon className="h-5 w-5" />
                                Organization Gallery
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {organization.images && organization.images.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {organization.images.map((image, index) => (
                                        <div key={index} className="aspect-square rounded-lg overflow-hidden border">
                                            <img
                                                src={image}
                                                alt={`Organization image ${index + 1}`}
                                                className="w-full h-full object-cover hover:scale-105 transition-transform"
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic text-center py-8">
                                    No images available.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Social Media Links Card (Full Width) */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Social Media Links</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-4">
                                {organization.social_media?.linkedin && (
                                    <a
                                        href={organization.social_media.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <FaLinkedin className="h-5 w-5" />
                                        <span>LinkedIn</span>
                                    </a>
                                )}
                                {organization.social_media?.twitter && (
                                    <a
                                        href={organization.social_media.twitter}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                                    >
                                        <FaTwitter className="h-5 w-5" />
                                        <span>Twitter</span>
                                    </a>
                                )}
                                {organization.social_media?.facebook && (
                                    <a
                                        href={organization.social_media.facebook}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                                    >
                                        <FaFacebook className="h-5 w-5" />
                                        <span>Facebook</span>
                                    </a>
                                )}
                                {organization.social_media?.instagram && (
                                    <a
                                        href={organization.social_media.instagram}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white rounded-lg hover:from-purple-600 hover:via-pink-600 hover:to-red-600 transition-colors"
                                    >
                                        <FaInstagram className="h-5 w-5" />
                                        <span>Instagram</span>
                                    </a>
                                )}
                                {organization.social_media?.github && (
                                    <a
                                        href={organization.social_media.github}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                                    >
                                        <FaGithub className="h-5 w-5" />
                                        <span>GitHub</span>
                                    </a>
                                )}
                                {organization.social_media?.youtube && (
                                    <a
                                        href={organization.social_media.youtube}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        <FaYoutube className="h-5 w-5" />
                                        <span>YouTube</span>
                                    </a>
                                )}
                                {(!organization.social_media ||
                                    Object.values(organization.social_media).every((v) => !v)) && (
                                        <p className="text-sm text-muted-foreground italic">
                                            No social media links available.
                                        </p>
                                    )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </RequireAuth>
    );
}

