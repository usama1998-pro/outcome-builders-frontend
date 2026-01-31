"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Shield,
    UserPlus,
    ArrowLeft,
    Crown,
    Plus,
    Pencil,
    Trash2,
    Key,
    Users,
    Layers,
    X,
    Save,
    Check,
    Brain,
    FileText,
    BarChart3,
    Bot,
    MoreVertical,
    UserMinus,
    Eye,
    EyeOff,
    User,
    Lock,
    Mail,
    RefreshCw,
    Clock,
    CheckCircle2,
    XCircle
} from "lucide-react";
import { useAuthStore } from "@/src/store/useAuth";
import { useOrganizationDetails } from "@/src/hooks/useOrganization";
import {
    usePermissions,
    useCustomRoles,
    useCreateCustomRole,
    useUpdateCustomRole,
    useDeleteCustomRole,
    groupPermissionsByCategory,
    type CustomRole
} from "@/src/hooks/useRoles";
import BlocksLoader from "@/src/components/Loaders/BlocksLoader/BlocksLoader";
import RequireAuth from "@/src/components/auth/requireAuth";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/src/lib/axios";
import routes from "@/src/lib/routes";
import { useUserPermissions, PERMISSIONS } from "@/src/hooks/useUserPermissions";
import { useTenantWorkspaces, useUserWorkspaceAssignments, useUpdateWorkspaceAssignments } from "@/src/hooks/useWorkspace";

// Category config with icons and colors
const categoryConfig: Record<string, { icon: React.ReactNode; gradient: string; bg: string }> = {
    "Brainspace": {
        icon: <Brain className="h-4 w-4" />,
        gradient: "from-purple-500 to-violet-500",
        bg: "bg-purple-500/10 border-purple-500/20"
    },
    "Collection": {
        icon: <Layers className="h-4 w-4" />,
        gradient: "from-blue-500 to-cyan-500",
        bg: "bg-blue-500/10 border-blue-500/20"
    },
    "Note": {
        icon: <FileText className="h-4 w-4" />,
        gradient: "from-emerald-500 to-teal-500",
        bg: "bg-emerald-500/10 border-emerald-500/20"
    },
    "Administration": {
        icon: <Shield className="h-4 w-4" />,
        gradient: "from-rose-500 to-pink-500",
        bg: "bg-rose-500/10 border-rose-500/20"
    },
    "Analytics": {
        icon: <BarChart3 className="h-4 w-4" />,
        gradient: "from-amber-500 to-orange-500",
        bg: "bg-amber-500/10 border-amber-500/20"
    },
    "AI": {
        icon: <Bot className="h-4 w-4" />,
        gradient: "from-indigo-500 to-blue-500",
        bg: "bg-indigo-500/10 border-indigo-500/20"
    },
};

export default function AdminsPage() {
    const router = useRouter();
    const currentTenantId = useAuthStore((s) => s.tenantId);
    const { data: organization, isLoading, isError, error } = useOrganizationDetails(currentTenantId || 0);

    // User permissions
    const {
        hasPermission,
        isOwnerOrAdmin,
        isLoading: permissionsCheckLoading
    } = useUserPermissions();

    // Permission checks - use actual permissions once loaded
    // permissionsCheckLoading is already being used to show loading state, so these will be false during loading
    // which is fine since we show a loading spinner anyway
    const canManageAdmins = hasPermission(PERMISSIONS.ADMIN_MANAGE) || isOwnerOrAdmin;
    const canManageRoles = hasPermission(PERMISSIONS.ROLE_MANAGE) || isOwnerOrAdmin;
    const canInviteUsers = hasPermission(PERMISSIONS.USER_INVITE) || isOwnerOrAdmin;

    // Check if user can access this page at all
    const canAccessPage = hasPermission(PERMISSIONS.ADMIN_MANAGE) ||
        hasPermission(PERMISSIONS.USER_INVITE) ||
        hasPermission(PERMISSIONS.ROLE_MANAGE) ||
        isOwnerOrAdmin;

    // Invitations interface and functions
    interface Invitation {
        id: number;
        email: string;
        role_name: string;
        invitation_token: string;
        invitation_expires: string;
        invited_by: number;
        invited_by_email: string | null;
        workspace_ids: number[] | null;
        workspace_joining_tokens: Record<string, string> | null;
        created_at: string;
        used: boolean;
        is_expired: boolean;
    }

    // Fetch invitations
    const { data: invitations, isLoading: invitationsLoading } = useQuery<Invitation[]>({
        queryKey: ["invitations", currentTenantId],
        queryFn: async () => {
            if (!currentTenantId) return [];
            const { data } = await api.get(routes.user.invitations(currentTenantId));
            return data.data;
        },
        enabled: !!currentTenantId && canInviteUsers,
    });

    // Resend invitation mutation
    const { mutate: resendInvitation, isPending: isResendingInvitation } = useMutation({
        mutationFn: async (invitationId: number) => {
            if (!currentTenantId) throw new Error("No tenant ID");
            const { data } = await api.post(routes.user.resendInvitation(currentTenantId, invitationId));
            return data.data;
        },
        onSuccess: (data) => {
            toast.success(data.message || "Invitation resent successfully");
            queryClient.invalidateQueries({ queryKey: ["invitations", currentTenantId] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.detail || "Failed to resend invitation");
        },
    });

    // Delete invitation mutation
    const [invitationToDelete, setInvitationToDelete] = useState<Invitation | null>(null);
    const { mutate: deleteInvitation, isPending: isDeletingInvitation } = useMutation({
        mutationFn: async (invitationId: number) => {
            if (!currentTenantId) throw new Error("No tenant ID");
            const { data } = await api.delete(routes.user.deleteInvitation(currentTenantId, invitationId));
            return data.data;
        },
        onSuccess: (data) => {
            toast.success(data.message || "Invitation deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["invitations", currentTenantId] });
            setInvitationToDelete(null);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.detail || "Failed to delete invitation");
        },
    });

    // Format date helper
    const formatDate = (dateString: string): string => {
        try {
            const date = new Date(dateString);
            return date.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            });
        } catch {
            return "N/A";
        }
    };

    // Get workspace names from IDs
    const getWorkspaceNames = (workspaceIds: number[]): string[] => {
        if (!tenantWorkspaces || !workspaceIds) return [];
        return workspaceIds
            .map(id => {
                const workspace = tenantWorkspaces.find(w => w.id === id);
                return workspace?.name || `Workspace ${id}`;
            })
            .filter(Boolean);
    };

    // Custom roles hooks
    const { data: permissions, isLoading: permissionsLoading } = usePermissions();
    const { data: customRoles, isLoading: rolesLoading } = useCustomRoles();
    const { mutate: createRole, isPending: isCreatingRole } = useCreateCustomRole();
    const { mutate: updateRole, isPending: isUpdatingRole } = useUpdateCustomRole();
    const { mutate: deleteRole, isPending: isDeletingRole } = useDeleteCustomRole();

    // State for role management - inline form
    const [isEditingMode, setIsEditingMode] = useState(false);
    const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
    const [roleName, setRoleName] = useState("");
    const [roleDescription, setRoleDescription] = useState("");
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<CustomRole | null>(null);

    // Member management state
    const [memberToRemove, setMemberToRemove] = useState<{ id: number; name: string } | null>(null);
    const [memberToEdit, setMemberToEdit] = useState<{ id: number; name: string; email: string; role: string } | null>(null);
    const [newMemberRole, setNewMemberRole] = useState("");
    const [newMemberName, setNewMemberName] = useState("");
    const [newMemberPassword, setNewMemberPassword] = useState("");
    const [showMemberPassword, setShowMemberPassword] = useState(false);
    const [selectedWorkspaces, setSelectedWorkspaces] = useState<number[]>([]);
    const queryClient = useQueryClient();

    // Workspace assignments for member editing
    const { data: tenantWorkspaces } = useTenantWorkspaces(currentTenantId);
    const { data: memberWorkspaceAssignments, refetch: refetchAssignments } = useUserWorkspaceAssignments(
        currentTenantId,
        memberToEdit?.id ?? null
    );
    const { mutate: updateWorkspaceAssignments, isPending: isUpdatingWorkspaces } = useUpdateWorkspaceAssignments();

    // Remove member mutation
    const { mutate: removeMember, isPending: isRemovingMember } = useMutation({
        mutationFn: async (memberId: number) => {
            const { data } = await api.delete(routes.user.removeMember(currentTenantId!, memberId));
            return data;
        },
        onSuccess: (data) => {
            toast.success(data.message || "Member removed successfully");
            queryClient.invalidateQueries({ queryKey: ["organizationDetails", currentTenantId] });
            queryClient.invalidateQueries({ queryKey: ["analytics"] });
            setMemberToRemove(null);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.detail || "Failed to remove member");
        },
    });

    // Update member role mutation
    const { mutate: updateMemberRole, isPending: isUpdatingMemberRole } = useMutation({
        mutationFn: async ({ email, roleName }: { email: string; roleName: string }) => {
            const { data } = await api.patch(routes.user.updateRole, {
                user_email: email,
                tenant_id: currentTenantId,
                role_name: roleName,
            });
            return data;
        },
        onSuccess: (data) => {
            toast.success(data.message || "Member role updated successfully");
            queryClient.invalidateQueries({ queryKey: ["organizationDetails", currentTenantId] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.detail || "Failed to update member role");
        },
    });

    // Update member credentials mutation
    const { mutate: updateMemberCredentials, isPending: isUpdatingMemberCredentials } = useMutation({
        mutationFn: async ({ userId, name, password }: { userId: number; name?: string; password?: string }) => {
            const payload: { name?: string; password?: string } = {};
            if (name) payload.name = name;
            if (password) payload.password = password;

            const { data } = await api.put(routes.user.updateMember(currentTenantId!, userId), payload);
            return data;
        },
        onSuccess: (data) => {
            toast.success(data.message || "Member updated successfully");
            queryClient.invalidateQueries({ queryKey: ["organizationDetails", currentTenantId] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.detail || "Failed to update member");
        },
    });

    // Populate selected workspaces when member assignments are loaded
    useEffect(() => {
        if (memberWorkspaceAssignments) {
            setSelectedWorkspaces(memberWorkspaceAssignments.map(a => a.workspace_id));
        }
    }, [memberWorkspaceAssignments]);

    const groupedPermissions = permissions ? groupPermissionsByCategory(permissions) : {};

    const handleWorkspaceToggle = (workspaceId: number) => {
        setSelectedWorkspaces(prev =>
            prev.includes(workspaceId)
                ? prev.filter(id => id !== workspaceId)
                : [...prev, workspaceId]
        );
    };

    const handleSaveMember = () => {
        if (!memberToEdit || !currentTenantId) return;

        // Update role if changed
        if (newMemberRole && newMemberRole !== memberToEdit.role.toLowerCase()) {
            updateMemberRole({
                email: memberToEdit.email,
                roleName: newMemberRole
            });
        }

        // Update name and/or password if provided
        if (newMemberName.trim() || newMemberPassword.trim()) {
            updateMemberCredentials({
                userId: memberToEdit.id,
                name: newMemberName.trim() || undefined,
                password: newMemberPassword.trim() || undefined
            });
        }

        // Update workspace assignments
        updateWorkspaceAssignments({
            tenantId: currentTenantId,
            payload: {
                user_id: memberToEdit.id,
                workspace_ids: selectedWorkspaces
            }
        }, {
            onSuccess: () => {
                toast.success("Member updated successfully");
                setMemberToEdit(null);
                setNewMemberRole("");
                setNewMemberName("");
                setNewMemberPassword("");
                setSelectedWorkspaces([]);
            },
            onError: (err: any) => {
                toast.error(err?.response?.data?.detail || "Failed to update workspace assignments");
            }
        });
    };

    const startCreateRole = () => {
        setEditingRole(null);
        setRoleName("");
        setRoleDescription("");
        setSelectedPermissions([]);
        setIsEditingMode(true);
    };

    const startEditRole = (role: CustomRole) => {
        setEditingRole(role);
        setRoleName(role.name);
        setRoleDescription(role.description || "");
        setSelectedPermissions(role.permissions);
        setIsEditingMode(true);
    };

    const cancelEditing = () => {
        setIsEditingMode(false);
        setEditingRole(null);
        setRoleName("");
        setRoleDescription("");
        setSelectedPermissions([]);
    };

    const handlePermissionToggle = (permKey: string) => {
        setSelectedPermissions(prev =>
            prev.includes(permKey)
                ? prev.filter(p => p !== permKey)
                : [...prev, permKey]
        );
    };

    const handleSelectAllInCategory = (category: string, checked: boolean) => {
        const categoryPerms = groupedPermissions[category]?.map(p => p.key) || [];
        if (checked) {
            setSelectedPermissions(prev => [...new Set([...prev, ...categoryPerms])]);
        } else {
            setSelectedPermissions(prev => prev.filter(p => !categoryPerms.includes(p)));
        }
    };

    const isCategoryFullySelected = (category: string) => {
        const categoryPerms = groupedPermissions[category]?.map(p => p.key) || [];
        return categoryPerms.length > 0 && categoryPerms.every(p => selectedPermissions.includes(p));
    };

    const getCategorySelectedCount = (category: string) => {
        const categoryPerms = groupedPermissions[category]?.map(p => p.key) || [];
        return categoryPerms.filter(p => selectedPermissions.includes(p)).length;
    };

    const handleSaveRole = () => {
        if (!roleName.trim()) {
            toast.error("Role name is required");
            return;
        }

        if (editingRole) {
            updateRole(
                {
                    roleId: editingRole.id,
                    payload: {
                        name: roleName.trim(),
                        description: roleDescription.trim() || undefined,
                        permissions: selectedPermissions,
                    },
                },
                {
                    onSuccess: () => {
                        toast.success("Role updated successfully!");
                        cancelEditing();
                    },
                    onError: (err: any) => {
                        toast.error(err?.response?.data?.detail || "Failed to update role.");
                    },
                }
            );
        } else {
            createRole(
                {
                    name: roleName.trim(),
                    description: roleDescription.trim() || undefined,
                    permissions: selectedPermissions,
                },
                {
                    onSuccess: () => {
                        toast.success("Role created successfully!");
                        cancelEditing();
                    },
                    onError: (err: any) => {
                        toast.error(err?.response?.data?.detail || "Failed to create role.");
                    },
                }
            );
        }
    };

    const handleDeleteRole = () => {
        if (!roleToDelete) return;

        deleteRole(roleToDelete.id, {
            onSuccess: () => {
                toast.success("Role deleted successfully!");
                setDeleteDialogOpen(false);
                setRoleToDelete(null);
                if (editingRole?.id === roleToDelete.id) {
                    cancelEditing();
                }
            },
            onError: (err: any) => {
                toast.error(err?.response?.data?.detail || "Failed to delete role.");
            },
        });
    };

    // Redirect unauthorized users after permissions are loaded
    useEffect(() => {
        if (!permissionsCheckLoading && !canAccessPage) {
            toast.error("You don't have permission to access this page");
            router.push("/dashboard");
        }
    }, [permissionsCheckLoading, canAccessPage, router]);

    if (isLoading || permissionsCheckLoading) {
        return (
            <RequireAuth>
                <div className="w-full h-full flex items-center justify-center p-5">
                    <BlocksLoader />
                </div>
            </RequireAuth>
        );
    }

    // Block rendering if user doesn't have access (while redirect is happening)
    if (!canAccessPage) {
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
            <div className="w-full h-full flex flex-col p-6 gap-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-dashed pb-4">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/organization">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-2">
                                <Users className="h-8 w-8 text-emerald-500" />
                                Team Management
                            </h1>
                            <p className="text-muted-foreground">
                                Manage team members and create custom roles for {organization.company_name}
                            </p>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="admins" className="w-full flex flex-col items-center">
                    <TabsList className={`grid w-full max-w-2xl ${canManageRoles ? "grid-cols-3" : "grid-cols-2"}`}>
                        <TabsTrigger value="admins" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Team Members
                        </TabsTrigger>
                        {canInviteUsers && (
                            <TabsTrigger value="invitations" className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Invitations
                            </TabsTrigger>
                        )}
                        {canManageRoles && (
                            <TabsTrigger value="roles" className="flex items-center gap-2">
                                <Key className="h-4 w-4" />
                                Custom Roles
                            </TabsTrigger>
                        )}
                    </TabsList>

                    {/* Admins Tab */}
                    <TabsContent value="admins" className="mt-6 w-full">
                        <div className="max-w-4xl mx-auto space-y-6">
                            {/* Add Member Button - Only show if user has permission */}
                            {canInviteUsers && (
                                <div className="flex justify-end">
                                    <Link href="/dashboard/admins/invite">
                                        <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Invite New Member
                                        </Button>
                                    </Link>
                                </div>
                            )}

                            {/* Owner Section */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Crown className="h-5 w-5 text-yellow-500" />
                                        Owner
                                    </CardTitle>
                                    <CardDescription>
                                        The owner has full control over the organization
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-lg border border-yellow-500/20">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src="" alt={organization.owner_name || "Owner"} />
                                            <AvatarFallback className="bg-yellow-500 text-white">
                                                {organization.owner_name?.charAt(0).toUpperCase() || "O"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="font-semibold text-lg">{organization.owner_name || "Unknown"}</p>
                                            <p className="text-sm text-muted-foreground">{organization.owner_email || ""}</p>
                                        </div>
                                        <Badge className="bg-yellow-500 text-white">Owner</Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Team Members Section */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5 text-emerald-500" />
                                        Team Members ({organization.admins?.length || 0})
                                    </CardTitle>
                                    <CardDescription>
                                        All members of your organization with their assigned roles
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {organization.admins && organization.admins.length > 0 ? (
                                        <div className="space-y-3">
                                            {organization.admins.map((member, index) => {
                                                // Role-based styling
                                                const isAdmin = member.role.toLowerCase() === "admin";
                                                const gradientClass = isAdmin
                                                    ? "from-rose-500/5 to-pink-500/5 border-rose-500/10 hover:border-rose-500/30"
                                                    : "from-emerald-500/5 to-teal-500/5 border-emerald-500/10 hover:border-emerald-500/30";
                                                const avatarClass = isAdmin
                                                    ? "bg-gradient-to-r from-rose-500 to-pink-500"
                                                    : "bg-gradient-to-r from-emerald-500 to-teal-500";
                                                const badgeClass = isAdmin
                                                    ? "bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500"
                                                    : "bg-gradient-to-r from-emerald-500 to-teal-500";

                                                return (
                                                    <div
                                                        key={index}
                                                        className={`flex items-center gap-4 p-4 bg-gradient-to-r ${gradientClass} rounded-lg border transition-colors`}
                                                    >
                                                        <Avatar className="h-12 w-12">
                                                            <AvatarImage src="" alt={member.name} />
                                                            <AvatarFallback className={`${avatarClass} text-white`}>
                                                                {member.name.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <p className="font-semibold">{member.name}</p>
                                                            <p className="text-sm text-muted-foreground">{member.email}</p>
                                                        </div>
                                                        <Badge className={`${badgeClass} text-white border-0`}>
                                                            {member.role}
                                                        </Badge>
                                                        {/* Only show actions if user can manage admins */}
                                                        {canManageAdmins && (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setMemberToEdit({
                                                                                id: member.id,
                                                                                name: member.name,
                                                                                email: member.email,
                                                                                role: member.role
                                                                            });
                                                                            setNewMemberRole(member.role.toLowerCase());
                                                                            setNewMemberName("");
                                                                            setNewMemberPassword("");
                                                                            setSelectedWorkspaces([]); // Will be populated by useEffect
                                                                        }}
                                                                    >
                                                                        <Pencil className="h-4 w-4 mr-2" />
                                                                        Edit Member
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => setMemberToRemove({ id: member.id, name: member.name })}
                                                                        className="text-red-600"
                                                                    >
                                                                        <UserMinus className="h-4 w-4 mr-2" />
                                                                        Remove Member
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                                            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                            <p className="text-muted-foreground">No team members yet.</p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Click &quot;Invite New Member&quot; to add your first team member.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Invitations Tab - Only show if user can invite users */}
                    {canInviteUsers && (
                        <TabsContent value="invitations" className="mt-6 w-full">
                            <div className="max-w-4xl mx-auto space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Mail className="h-5 w-5 text-blue-500" />
                                            Invitations ({invitations?.length || 0})
                                        </CardTitle>
                                        <CardDescription>
                                            View and manage invitations sent to join your organization
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {invitationsLoading ? (
                                            <div className="flex items-center justify-center py-12">
                                                <BlocksLoader />
                                            </div>
                                        ) : !invitations || invitations.length === 0 ? (
                                            <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                                                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                                <p className="text-muted-foreground">No invitations found.</p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Click &quot;Invite New Member&quot; to send your first invitation.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {invitations.map((invitation: Invitation) => (
                                                    <Card key={invitation.id} className="border-l-4 border-l-blue-500">
                                                        <CardHeader>
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <CardTitle className="flex items-center gap-2 text-lg">
                                                                        {invitation.email}
                                                                        {invitation.used ? (
                                                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400">
                                                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                                                Used
                                                                            </Badge>
                                                                        ) : invitation.is_expired ? (
                                                                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400">
                                                                                <XCircle className="w-3 h-3 mr-1" />
                                                                                Expired
                                                                            </Badge>
                                                                        ) : (
                                                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400">
                                                                                <Clock className="w-3 h-3 mr-1" />
                                                                                Pending
                                                                            </Badge>
                                                                        )}
                                                                    </CardTitle>
                                                                    <CardDescription className="mt-2">
                                                                        Role: <span className="font-medium">{invitation.role_name}</span>
                                                                        {invitation.invited_by_email && (
                                                                            <> • Invited by: {invitation.invited_by_email}</>
                                                                        )}
                                                                    </CardDescription>
                                                                </div>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <div className="space-y-4">
                                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                                    <div>
                                                                        <p className="text-muted-foreground">Created</p>
                                                                        <p className="font-medium">
                                                                            {invitation.created_at ? formatDate(invitation.created_at) : "N/A"}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-muted-foreground">Expires</p>
                                                                        <p className="font-medium">
                                                                            {invitation.invitation_expires ? formatDate(invitation.invitation_expires) : "N/A"}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {invitation.workspace_ids && invitation.workspace_ids.length > 0 && (
                                                                    <div>
                                                                        <p className="text-sm text-muted-foreground mb-2">
                                                                            Workspaces:
                                                                        </p>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {getWorkspaceNames(invitation.workspace_ids).map((name, idx) => (
                                                                                <Badge
                                                                                    key={idx}
                                                                                    variant="outline"
                                                                                    className="bg-transparent border-white/50 text-foreground rounded-full px-3 py-1"
                                                                                >
                                                                                    {name}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <div className="flex gap-2 pt-2 border-t">
                                                                    {!invitation.used && (
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => resendInvitation(invitation.id)}
                                                                            disabled={isResendingInvitation}
                                                                            className="flex items-center gap-2"
                                                                        >
                                                                            <RefreshCw className={`w-4 h-4 ${isResendingInvitation ? "animate-spin" : ""}`} />
                                                                            {isResendingInvitation ? "Sending..." : "Resend Invitation"}
                                                                        </Button>
                                                                    )}
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => setInvitationToDelete(invitation)}
                                                                        disabled={isDeletingInvitation}
                                                                        className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                        Delete
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    )}

                    {/* Custom Roles Tab - Only show if user can manage roles */}
                    {canManageRoles && (
                        <TabsContent value="roles" className="mt-6 w-full">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                                {/* Roles List - Left Column */}
                                <div className="lg:col-span-1 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-lg">Roles</h3>
                                        <Button
                                            size="sm"
                                            onClick={startCreateRole}
                                            disabled={isEditingMode && !editingRole}
                                            className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white border-0"
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            New Role
                                        </Button>
                                    </div>

                                    {rolesLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <BlocksLoader />
                                        </div>
                                    ) : customRoles && customRoles.length > 0 ? (
                                        <div className="space-y-2">
                                            {customRoles.map((role) => (
                                                <div
                                                    key={role.id}
                                                    className={`p-4 rounded-lg border cursor-pointer transition-all ${editingRole?.id === role.id
                                                        ? "bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/50"
                                                        : "bg-card hover:bg-muted/50 border-border"
                                                        }`}
                                                    onClick={() => startEditRole(role)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center shrink-0">
                                                            <Key className="h-5 w-5 text-white" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold truncate">{role.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {role.permissions.length} permissions
                                                            </p>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setRoleToDelete(role);
                                                                setDeleteDialogOpen(true);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed">
                                            <Key className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                            <p className="text-sm text-muted-foreground">No custom roles yet.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Role Editor - Right Column */}
                                <div className="lg:col-span-2">
                                    {isEditingMode ? (
                                        <Card>
                                            <CardHeader className="pb-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <CardTitle className="flex items-center gap-2">
                                                            {editingRole ? (
                                                                <>
                                                                    <Pencil className="h-5 w-5 text-violet-500" />
                                                                    Edit Role
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Plus className="h-5 w-5 text-violet-500" />
                                                                    Create New Role
                                                                </>
                                                            )}
                                                        </CardTitle>
                                                        <CardDescription>
                                                            {editingRole
                                                                ? "Update the role name, description, and permissions."
                                                                : "Define a new role with specific permissions."
                                                            }
                                                        </CardDescription>
                                                    </div>
                                                    <Button variant="ghost" size="icon" onClick={cancelEditing}>
                                                        <X className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                {/* Role Details */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="roleName">Role Name *</Label>
                                                        <Input
                                                            id="roleName"
                                                            placeholder="e.g. Content Manager"
                                                            value={roleName}
                                                            onChange={(e) => setRoleName(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="roleDescription">Description</Label>
                                                        <Input
                                                            id="roleDescription"
                                                            placeholder="What this role does..."
                                                            value={roleDescription}
                                                            onChange={(e) => setRoleDescription(e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Permissions */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <Label className="text-base">Permissions</Label>
                                                            <p className="text-sm text-muted-foreground">
                                                                Select what this role can do
                                                            </p>
                                                        </div>
                                                        <Badge variant="secondary">
                                                            {selectedPermissions.length} selected
                                                        </Badge>
                                                    </div>

                                                    {permissionsLoading ? (
                                                        <div className="flex items-center justify-center py-8">
                                                            <BlocksLoader />
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {Object.entries(groupedPermissions).map(([category, perms]) => {
                                                                const config = categoryConfig[category] || {
                                                                    icon: <Layers className="h-4 w-4" />,
                                                                    gradient: "from-gray-500 to-slate-500",
                                                                    bg: "bg-gray-500/10 border-gray-500/20"
                                                                };
                                                                const selectedCount = getCategorySelectedCount(category);
                                                                const totalCount = perms.length;

                                                                return (
                                                                    <div
                                                                        key={category}
                                                                        className={`rounded-lg border p-4 ${config.bg}`}
                                                                    >
                                                                        {/* Category Header */}
                                                                        <div className="flex items-center justify-between mb-3">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className={`h-8 w-8 rounded-lg bg-gradient-to-r ${config.gradient} flex items-center justify-center text-white`}>
                                                                                    {config.icon}
                                                                                </div>
                                                                                <div>
                                                                                    <span className="font-semibold text-sm">{category}</span>
                                                                                    <p className="text-xs text-muted-foreground">
                                                                                        {selectedCount}/{totalCount}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <Checkbox
                                                                                    id={`select-all-${category}`}
                                                                                    checked={isCategoryFullySelected(category)}
                                                                                    onCheckedChange={(checked: boolean | "indeterminate") =>
                                                                                        handleSelectAllInCategory(category, checked === true)
                                                                                    }
                                                                                />
                                                                                <Label
                                                                                    htmlFor={`select-all-${category}`}
                                                                                    className="text-xs cursor-pointer"
                                                                                >
                                                                                    All
                                                                                </Label>
                                                                            </div>
                                                                        </div>

                                                                        {/* Permissions */}
                                                                        <div className="space-y-2">
                                                                            {perms.map((perm) => {
                                                                                const isSelected = selectedPermissions.includes(perm.key);
                                                                                return (
                                                                                    <div
                                                                                        key={perm.key}
                                                                                        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${isSelected
                                                                                            ? "bg-white/50 dark:bg-black/20"
                                                                                            : "hover:bg-white/30 dark:hover:bg-black/10"
                                                                                            }`}
                                                                                        onClick={() => handlePermissionToggle(perm.key)}
                                                                                    >
                                                                                        <div className={`h-5 w-5 rounded flex items-center justify-center shrink-0 transition-colors ${isSelected
                                                                                            ? `bg-gradient-to-r ${config.gradient}`
                                                                                            : "border-2 border-muted-foreground/30"
                                                                                            }`}>
                                                                                            {isSelected && (
                                                                                                <Check className="h-3 w-3 text-white" />
                                                                                            )}
                                                                                        </div>
                                                                                        <span className="text-sm">{perm.name}</span>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                                                    <Button variant="outline" onClick={cancelEditing}>
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        onClick={handleSaveRole}
                                                        disabled={isCreatingRole || isUpdatingRole}
                                                        className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white border-0"
                                                    >
                                                        <Save className="h-4 w-4 mr-2" />
                                                        {isCreatingRole || isUpdatingRole
                                                            ? "Saving..."
                                                            : editingRole ? "Update Role" : "Create Role"
                                                        }
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <Card>
                                            <CardContent className="flex flex-col items-center justify-center py-16">
                                                <Key className="h-16 w-16 text-muted-foreground mb-4" />
                                                <h3 className="text-xl font-semibold mb-2">Select or Create a Role</h3>
                                                <p className="text-muted-foreground text-center max-w-md mb-6">
                                                    Click on a role from the list to edit it, or create a new role with custom permissions.
                                                </p>
                                                <Button
                                                    onClick={startCreateRole}
                                                    className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white border-0"
                                                >
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Create New Role
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    )}
                </Tabs>

                {/* Delete Role Confirmation Dialog */}
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Role</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete the role &quot;{roleToDelete?.name}&quot;?
                                This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeletingRole}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteRole}
                                disabled={isDeletingRole}
                                className="bg-red-500 hover:bg-red-600"
                            >
                                {isDeletingRole ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Remove Member Confirmation Dialog */}
                <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                <UserMinus className="h-5 w-5" />
                                Remove Member
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to remove <strong>{memberToRemove?.name}</strong> from the organization?
                                They will lose access to all resources in this organization.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isRemovingMember}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => memberToRemove && removeMember(memberToRemove.id)}
                                disabled={isRemovingMember}
                                className="bg-red-500 hover:bg-red-600"
                            >
                                {isRemovingMember ? "Removing..." : "Remove Member"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Edit Member Dialog */}
                <AlertDialog open={!!memberToEdit} onOpenChange={(open) => {
                    if (!open) {
                        setMemberToEdit(null);
                        setNewMemberRole("");
                        setNewMemberName("");
                        setNewMemberPassword("");
                        setShowMemberPassword(false);
                        setSelectedWorkspaces([]);
                    }
                }}>
                    <AlertDialogContent className="!max-w-5xl max-h-[90vh] overflow-y-auto w-[90vw]">
                        <AlertDialogHeader className="border-b pb-4">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold">
                                    {memberToEdit?.name?.charAt(0).toUpperCase() || "M"}
                                </div>
                                <div>
                                    <AlertDialogTitle className="text-xl">
                                        Edit Member
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="mt-1">
                                        {memberToEdit?.name} • {memberToEdit?.email}
                                    </AlertDialogDescription>
                                </div>
                            </div>
                        </AlertDialogHeader>

                        <div className="space-y-6 py-6">
                            {/* Profile Information Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    <User className="h-4 w-4" />
                                    Profile Information
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
                                    <div className="space-y-2">
                                        <Label htmlFor="member-name" className="flex items-center gap-2 font-medium">
                                            <User className="h-4 w-4 text-blue-500" />
                                            Display Name
                                        </Label>
                                        <Input
                                            id="member-name"
                                            placeholder={memberToEdit?.name || "Enter new name"}
                                            value={newMemberName}
                                            onChange={(e) => setNewMemberName(e.target.value)}
                                            className="bg-background"
                                        />
                                        <p className="text-xs text-muted-foreground">Leave empty to keep current name</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="member-password" className="flex items-center gap-2 font-medium">
                                            <Lock className="h-4 w-4 text-blue-500" />
                                            New Password
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="member-password"
                                                type={showMemberPassword ? "text" : "password"}
                                                placeholder="Enter new password"
                                                value={newMemberPassword}
                                                onChange={(e) => setNewMemberPassword(e.target.value)}
                                                className="bg-background pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowMemberPassword(!showMemberPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                aria-label={showMemberPassword ? "Hide password" : "Show password"}
                                            >
                                                {showMemberPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Leave empty to keep current password</p>
                                    </div>
                                </div>
                            </div>

                            {/* Role & Permissions Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    <Shield className="h-4 w-4" />
                                    Role & Permissions
                                </div>
                                <div className="p-4 bg-muted/30 rounded-lg border">
                                    <Label htmlFor="role-select" className="flex items-center gap-2 font-medium mb-2">
                                        <Key className="h-4 w-4 text-violet-500" />
                                        Assigned Role
                                    </Label>
                                    <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                                        <SelectTrigger id="role-select" className="bg-background">
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="member">Member</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            {customRoles?.map((role) => (
                                                <SelectItem key={role.id} value={role.name.toLowerCase()}>
                                                    {role.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Workspace Access Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                        <Brain className="h-4 w-4" />
                                        Brainspace Access
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {selectedWorkspaces.length} of {tenantWorkspaces?.length || 0} selected
                                    </Badge>
                                </div>
                                <div className="border rounded-lg bg-muted/30 overflow-hidden">
                                    {tenantWorkspaces && tenantWorkspaces.length > 0 ? (
                                        <>
                                            {/* Select All Header */}
                                            <div className="flex items-center space-x-3 p-3 bg-muted/50 border-b">
                                                <Checkbox
                                                    id="select-all-workspaces"
                                                    checked={tenantWorkspaces.length > 0 && selectedWorkspaces.length === tenantWorkspaces.length}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedWorkspaces(tenantWorkspaces.map(w => w.id));
                                                        } else {
                                                            setSelectedWorkspaces([]);
                                                        }
                                                    }}
                                                />
                                                <label htmlFor="select-all-workspaces" className="text-sm font-medium cursor-pointer">
                                                    Select All Brainspaces
                                                </label>
                                            </div>
                                            {/* Workspaces List */}
                                            <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                                                {tenantWorkspaces.map((workspace) => (
                                                    <div
                                                        key={workspace.id}
                                                        className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer transition-colors ${selectedWorkspaces.includes(workspace.id)
                                                            ? "bg-blue-500/10 border border-blue-500/20"
                                                            : "hover:bg-muted/50"
                                                            }`}
                                                        onClick={() => handleWorkspaceToggle(workspace.id)}
                                                    >
                                                        <Checkbox
                                                            id={`workspace-${workspace.id}`}
                                                            checked={selectedWorkspaces.includes(workspace.id)}
                                                            onCheckedChange={() => handleWorkspaceToggle(workspace.id)}
                                                        />
                                                        <Brain className={`h-4 w-4 ${selectedWorkspaces.includes(workspace.id) ? "text-blue-500" : "text-muted-foreground"}`} />
                                                        <label
                                                            htmlFor={`workspace-${workspace.id}`}
                                                            className="text-sm flex-1 cursor-pointer"
                                                        >
                                                            {workspace.name}
                                                        </label>
                                                        {selectedWorkspaces.includes(workspace.id) && (
                                                            <Check className="h-4 w-4 text-blue-500" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-8">
                                            <Brain className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                                            <p className="text-sm text-muted-foreground">
                                                No brainspaces available in this organization
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <AlertDialogFooter className="border-t pt-4">
                            <AlertDialogCancel
                                disabled={isUpdatingMemberRole || isUpdatingWorkspaces || isUpdatingMemberCredentials}
                                className="px-6"
                            >
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleSaveMember}
                                disabled={isUpdatingMemberRole || isUpdatingWorkspaces || isUpdatingMemberCredentials}
                                className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 px-6"
                            >
                                {isUpdatingMemberRole || isUpdatingWorkspaces || isUpdatingMemberCredentials ? (
                                    <>
                                        <span className="animate-pulse">Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Delete Invitation Confirmation Dialog */}
                <AlertDialog open={!!invitationToDelete} onOpenChange={(open) => !open && setInvitationToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                <Trash2 className="h-5 w-5" />
                                Delete Invitation
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete the invitation for <strong>{invitationToDelete?.email}</strong>?
                                This action cannot be undone. The invitation link will no longer be valid.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeletingInvitation}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => invitationToDelete && deleteInvitation(invitationToDelete.id)}
                                disabled={isDeletingInvitation}
                                className="bg-red-500 hover:bg-red-600"
                            >
                                {isDeletingInvitation ? "Deleting..." : "Delete Invitation"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </RequireAuth>
    );
}
