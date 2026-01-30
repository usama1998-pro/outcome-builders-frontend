"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    UserPlus,
    ArrowLeft,
    Mail,
    Shield
} from "lucide-react";
import { useAuthStore } from "@/src/store/useAuth";
import { useCustomRoles } from "@/src/hooks/useRoles";
import RequireAuth from "@/src/components/auth/requireAuth";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/src/lib/axios";
import routes from "@/src/lib/routes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserPermissions, PERMISSIONS } from "@/src/hooks/useUserPermissions";
import BlocksLoader from "@/src/components/Loaders/BlocksLoader/BlocksLoader";
import { useTenantWorkspaces } from "@/src/hooks/useWorkspace";
import { Checkbox } from "@/components/ui/checkbox";
import { Brain, Check } from "lucide-react";

interface InviteUserPayload {
    email: string;
    role_name: string;
    workspace_ids?: number[];
}

interface InviteUserResponse {
    status: boolean;
    message: string;
    data: {
        email: string;
        role: string;
        message: string;
    };
}

function useInviteUser() {
    const queryClient = useQueryClient();
    const tenantId = useAuthStore((s) => s.tenantId);

    return useMutation({
        mutationFn: async (payload: InviteUserPayload) => {
            const { data } = await api.post<InviteUserResponse>(
                routes.user.invite(tenantId!),
                payload
            );
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["organizationDetails", tenantId] });
            queryClient.invalidateQueries({ queryKey: ["analytics"] });
        },
    });
}

export default function InviteAdminPage() {
    const router = useRouter();
    const tenantId = useAuthStore((s) => s.tenantId);
    const { mutate: inviteUser, isPending } = useInviteUser();
    const { data: customRoles } = useCustomRoles();
    const { data: tenantWorkspaces } = useTenantWorkspaces(tenantId);

    // Permission check
    const { hasPermission, isOwnerOrAdmin, isLoading: permissionsLoading } = useUserPermissions();
    const canInviteUsers = hasPermission(PERMISSIONS.USER_INVITE) || isOwnerOrAdmin;

    // Redirect unauthorized users
    useEffect(() => {
        if (!permissionsLoading && !canInviteUsers) {
            toast.error("You don't have permission to invite members");
            router.push("/dashboard");
        }
    }, [permissionsLoading, canInviteUsers, router]);

    // Form state
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("member");
    const [selectedWorkspaces, setSelectedWorkspaces] = useState<number[]>([]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!email.trim()) {
            toast.error("Email is required");
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            toast.error("Please enter a valid email address");
            return;
        }

        inviteUser(
            {
                email: email.trim(),
                role_name: role,
                workspace_ids: selectedWorkspaces.length > 0 ? selectedWorkspaces : undefined,
            },
            {
                onSuccess: (res) => {
                    toast.success(res.data.message || "Invitation sent successfully!");
                    router.push("/dashboard/admins");
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.detail || "Failed to send invitation. Please try again.");
                },
            }
        );
    };

    // Show loading while checking permissions
    if (permissionsLoading) {
        return (
            <RequireAuth>
                <div className="w-full h-full flex items-center justify-center p-5">
                    <BlocksLoader />
                </div>
            </RequireAuth>
        );
    }

    // Block rendering if user doesn't have access (while redirect is happening)
    if (!canInviteUsers) {
        return (
            <RequireAuth>
                <div className="w-full h-full flex items-center justify-center p-5">
                    <BlocksLoader />
                </div>
            </RequireAuth>
        );
    }

    return (
        <RequireAuth>
            <div className="w-full h-full flex flex-col p-6 gap-6">
                {/* Header */}
                <div className="flex items-center gap-4 border-b-2 border-dashed pb-4">
                    <Link href="/dashboard/admins">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <UserPlus className="h-8 w-8 text-emerald-500" />
                            Invite New Member
                        </h1>
                        <p className="text-muted-foreground">
                            Add a new member to your organization with a role
                        </p>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto w-full">
                    <Card>
                        <CardHeader>
                            <CardTitle>Invite Member</CardTitle>
                            <CardDescription>
                                Send an invitation email to join your organization. The member will create their own account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Email */}
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        Email Address *
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        An invitation email will be sent to this address
                                    </p>
                                </div>

                                {/* Role Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="role" className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-muted-foreground" />
                                        Role *
                                    </Label>
                                    <Select value={role} onValueChange={setRole}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="member">Member</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            {customRoles?.map((customRole) => (
                                                <SelectItem key={customRole.id} value={customRole.name.toLowerCase()}>
                                                    {customRole.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        {role === "admin"
                                            ? "Admins have full access to manage the organization"
                                            : role === "member"
                                                ? "Members have standard access to the organization"
                                                : "Custom role with specific permissions"
                                        }
                                    </p>
                                </div>

                                {/* Workspace Selection */}
                                {tenantWorkspaces && tenantWorkspaces.length > 0 && (
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Brain className="h-4 w-4 text-muted-foreground" />
                                            Brainspace Access (Optional)
                                        </Label>
                                        <div className="border rounded-lg bg-muted/30 overflow-hidden">
                                            {/* Select All Header */}
                                            <div className="flex items-center space-x-3 p-3 bg-muted/50 border-b">
                                                <Checkbox
                                                    id="select-all-workspaces-invite"
                                                    checked={tenantWorkspaces.length > 0 && selectedWorkspaces.length === tenantWorkspaces.length}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedWorkspaces(tenantWorkspaces.map(w => w.id));
                                                        } else {
                                                            setSelectedWorkspaces([]);
                                                        }
                                                    }}
                                                />
                                                <label htmlFor="select-all-workspaces-invite" className="text-sm font-medium cursor-pointer">
                                                    Select All Brainspaces
                                                </label>
                                            </div>
                                            {/* Workspaces List */}
                                            <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                                                {tenantWorkspaces.map((workspace) => {
                                                    const isSelected = selectedWorkspaces.includes(workspace.id);
                                                    return (
                                                        <div
                                                            key={workspace.id}
                                                            className={`flex items-center space-x-3 p-2 rounded-md transition-colors ${isSelected
                                                                    ? "bg-blue-500/10 border border-blue-500/20"
                                                                    : "hover:bg-muted/50"
                                                                }`}
                                                        >
                                                            <Checkbox
                                                                id={`workspace-invite-${workspace.id}`}
                                                                checked={isSelected}
                                                                onCheckedChange={(checked) => {
                                                                    setSelectedWorkspaces(prev =>
                                                                        checked
                                                                            ? [...prev, workspace.id]
                                                                            : prev.filter(id => id !== workspace.id)
                                                                    );
                                                                }}
                                                            />
                                                            <Brain className={`h-4 w-4 ${isSelected ? "text-blue-500" : "text-muted-foreground"}`} />
                                                            <label
                                                                htmlFor={`workspace-invite-${workspace.id}`}
                                                                className="text-sm flex-1 cursor-pointer"
                                                            >
                                                                {workspace.name}
                                                            </label>
                                                            {isSelected && (
                                                                <Check className="h-4 w-4 text-blue-500" />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Select which brainspaces the member will have access to. Leave empty to grant organization access only.
                                        </p>
                                    </div>
                                )}

                                {/* Info Box */}
                                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                                How it works
                                            </p>
                                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                                The invited member will receive an email with a link to create their account.
                                                Once they sign up, they&apos;ll automatically be added to your organization with the selected role.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                                    <Link href="/dashboard/admins">
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button
                                        type="submit"
                                        disabled={isPending || !email.trim()}
                                        className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0"
                                    >
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        {isPending ? "Sending Invitation..." : "Send Invitation"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </RequireAuth>
    );
}

