"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    User, 
    Lock, 
    Shield,
    Eye,
    EyeOff,
    CheckCircle2
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

interface InviteUserPayload {
    email: string;
    password: string;
    full_name: string;
    role_name: string;
    description?: string;
}

interface InviteUserResponse {
    status: boolean;
    message: string;
    data: {
        user_id: number;
        email: string;
        full_name: string;
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
    const { mutate: inviteUser, isPending } = useInviteUser();
    const { data: customRoles } = useCustomRoles();

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
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [role, setRole] = useState("admin");
    const [description, setDescription] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Password validation
    const passwordRequirements = [
        { label: "At least 8 characters", met: password.length >= 8 },
        { label: "One uppercase letter", met: /[A-Z]/.test(password) },
        { label: "One lowercase letter", met: /[a-z]/.test(password) },
        { label: "One number", met: /\d/.test(password) },
    ];

    const allPasswordRequirementsMet = passwordRequirements.every(r => r.met);
    const passwordsMatch = password === confirmPassword && password.length > 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!email.trim()) {
            toast.error("Email is required");
            return;
        }

        if (!fullName.trim()) {
            toast.error("Full name is required");
            return;
        }

        if (!allPasswordRequirementsMet) {
            toast.error("Password does not meet requirements");
            return;
        }

        if (!passwordsMatch) {
            toast.error("Passwords do not match");
            return;
        }

        inviteUser(
            {
                email: email.trim(),
                password,
                full_name: fullName.trim(),
                role_name: role,
                description: description.trim() || undefined,
            },
            {
                onSuccess: (res) => {
                    toast.success(res.data.message || "User invited successfully!");
                    router.push("/dashboard/admins");
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.detail || "Failed to invite user. Please try again.");
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
                            <CardTitle>Member Details</CardTitle>
                            <CardDescription>
                                Create a new account and assign a role to this member
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Full Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="fullName" className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        Full Name *
                                    </Label>
                                    <Input
                                        id="fullName"
                                        placeholder="John Doe"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>

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
                                    />
                                </div>

                                {/* Password */}
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="flex items-center gap-2">
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                        Password *
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Create a strong password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full px-3"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </Button>
                                    </div>
                                    {/* Password requirements */}
                                    {password.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            {passwordRequirements.map((req, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`flex items-center gap-2 text-xs ${
                                                        req.met ? "text-emerald-500" : "text-muted-foreground"
                                                    }`}
                                                >
                                                    <CheckCircle2 className={`h-3 w-3 ${req.met ? "" : "opacity-30"}`} />
                                                    {req.label}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                        Confirm Password *
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirm password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full px-3"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </Button>
                                    </div>
                                    {confirmPassword.length > 0 && (
                                        <p className={`text-xs ${passwordsMatch ? "text-emerald-500" : "text-red-500"}`}>
                                            {passwordsMatch ? "✓ Passwords match" : "✗ Passwords do not match"}
                                        </p>
                                    )}
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
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="member">Member</SelectItem>
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

                                {/* Description (Optional) */}
                                <div className="space-y-2">
                                    <Label htmlFor="description">
                                        Bio / Description (Optional)
                                    </Label>
                                    <Textarea
                                        id="description"
                                        placeholder="A brief description about this member..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                    />
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
                                        disabled={isPending || !allPasswordRequirementsMet || !passwordsMatch}
                                        className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0"
                                    >
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        {isPending ? "Inviting..." : "Invite Member"}
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

