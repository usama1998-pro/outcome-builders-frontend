"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RequireAuth from "@/src/components/auth/requireAuth";
import BlocksLoader from "@/src/components/Loaders/BlocksLoader/BlocksLoader";
import { useUserTenants } from "@/src/hooks/useAuth";
import { useAuthStore } from "@/src/store/useAuth";

function formatRole(role: string) {
    if (role === "superuser") return "Platform super admin";
    return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function OrganizationsListPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const currentTenantId = useAuthStore((s) => s.tenantId);
    const setTenantId = useAuthStore((s) => s.setTenantId);
    const { data: tenants = [], isLoading, isError, error } = useUserTenants();

    const handleSwitchOrganization = (tenantId: number) => {
        if (tenantId === currentTenantId) return;
        setTenantId(tenantId);
        queryClient.clear();
        router.push("/dashboard");
    };

    if (isLoading) {
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
                <div className="w-full border-b-2 border-dashed pb-4">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Building2 className="h-8 w-8 text-[#DB2B30]" />
                        Organizations
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Organizations you can access. Switch context to work in a different organization.
                    </p>
                </div>

                {isError ? (
                    <Card className="border-destructive/50">
                        <CardHeader>
                            <CardTitle className="text-destructive">Could not load organizations</CardTitle>
                            <CardDescription>{error?.message || "Please try again later."}</CardDescription>
                        </CardHeader>
                    </Card>
                ) : tenants.length === 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>No organizations</CardTitle>
                            <CardDescription>
                                You are not a member of any organization yet. Complete onboarding or accept an
                                invitation.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="outline">
                                <Link href="/onboarding">Go to onboarding</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Your organizations</CardTitle>
                            <CardDescription>
                                {tenants.length} organization{tenants.length === 1 ? "" : "s"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Your role</TableHead>
                                        <TableHead className="hidden md:table-cell">Schema</TableHead>
                                        <TableHead className="text-right w-[160px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tenants.map((tenant) => {
                                        const isCurrent = tenant.id === currentTenantId;
                                        return (
                                            <TableRow key={tenant.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {tenant.company_name}
                                                        {isCurrent && (
                                                            <Badge
                                                                variant="outline"
                                                                className="gap-1 border-[#DB2B30]/40 text-[#DB2B30]"
                                                            >
                                                                <CheckCircle2 className="h-3 w-3" />
                                                                Current
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {formatRole(tenant.role)}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">
                                                    {tenant.schema_name}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {isCurrent ? (
                                                        <span className="text-sm text-muted-foreground">Active</span>
                                                    ) : (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-[#DB2B30]/40 hover:bg-[#DB2B30]/10"
                                                            onClick={() => handleSwitchOrganization(tenant.id)}
                                                        >
                                                            Switch to
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </RequireAuth>
    );
}
