"use client";

import { useState } from "react";
import WorkSpacesList from "@/src/components/List/WorkSpaces/WorkSpacesList";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FaPlus } from "react-icons/fa";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { useCreateUserWorkspace, useUserWorkspaces } from "@/src/hooks/useWorkspace";
import { useUserTenants } from "@/src/hooks/useAuth";
import { useAuthStore } from "@/src/store/useAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import RequireAuth from "@/src/components/auth/requireAuth";

export type WorkspaceFilter = "all" | "my" | number; // number = specific tenant id

const createWorkspaceSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name is too long"),
});

type CreateWorkspaceFormValues = z.infer<typeof createWorkspaceSchema>;

export default function DashboardWorkspace() {
    const { mutate: createWorkspace, isPending } = useCreateUserWorkspace();
    const { data: tenants } = useUserTenants();
    const currentTenantId = useAuthStore((s) => s.tenantId);
    const [open, setOpen] = useState(false); // ✅ manual control
    const [filter, setFilter] = useState<WorkspaceFilter>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const form = useForm<CreateWorkspaceFormValues>({
        resolver: zodResolver(createWorkspaceSchema),
        defaultValues: { name: "" },
    });

    // Get unique organizations from tenants for the filter
    const otherOrganizations = tenants?.filter(t => t.id !== currentTenantId) || [];

    const onSubmit = (values: CreateWorkspaceFormValues) => {
        createWorkspace(values.name, {
            onSuccess: (res) => {
                if (res?.status) {
                    toast.success(res.message || "Workspace created successfully!");
                    form.reset();
                    setOpen(false); // ✅ close only when success
                } else {
                    form.reset();
                    toast.error(res?.message || "Could not create workspace.");
                }
            },
            onError: (err: any) => {
                toast.error(err?.message || "Request failed, please try again.");
            },
        });
    };

    return (
        <RequireAuth>
            <div className="flex flex-col items-center justify-center p-6">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard/workspaces">
                                Workspaces
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <nav className="sticky top-0 w-[90%] mx-auto self-center flex justify-between items-center bg-background border-b border-border py-5">
                    <div className="flex items-center gap-4">
                        <Input
                            type="text"
                            placeholder="Search workspaces..."
                            className="w-64"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Select 
                            value={typeof filter === "number" ? String(filter) : filter} 
                            onValueChange={(value) => {
                                if (value === "all" || value === "my") {
                                    setFilter(value);
                                } else {
                                    setFilter(Number(value));
                                }
                            }}
                        >
                            <SelectTrigger className="w-56">
                                <SelectValue placeholder="Filter workspaces" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Workspaces</SelectItem>
                                <SelectItem value="my">My Workspaces</SelectItem>
                                {otherOrganizations.length > 0 && (
                                    <>
                                        {otherOrganizations.map((org) => (
                                            <SelectItem key={org.id} value={String(org.id)}>
                                                {org.company_name}
                                            </SelectItem>
                                        ))}
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* ✅ Controlled dialog */}
                    <AlertDialog open={open} onOpenChange={setOpen}>
                        <AlertDialogTrigger asChild>
                            <Button className="outline">
                                <FaPlus className="mr-2" /> New Workspace
                            </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Create a new workspace</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Enter a name for your new workspace below.
                                </AlertDialogDescription>
                            </AlertDialogHeader>

                            <form
                                id="create-workspace-form"
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="space-y-4"
                            >
                                <div>
                                    <Label className="pb-3" htmlFor="name">
                                        Workspace name
                                    </Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. ai-workspace"
                                        {...form.register("name")}
                                        aria-invalid={!!form.formState.errors.name}
                                    />
                                    {form.formState.errors.name && (
                                        <p className="text-sm !text-red-500 mt-1">
                                            {form.formState.errors.name.message}
                                        </p>
                                    )}
                                </div>

                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isPending}>
                                        Cancel
                                    </AlertDialogCancel>
                                    {/* ✅ regular button now */}
                                    <Button
                                        type="submit"
                                        disabled={isPending}
                                        className="ml-2"
                                    >
                                        {isPending ? "Creating..." : "Create"}
                                    </Button>
                                </AlertDialogFooter>
                            </form>
                        </AlertDialogContent>
                    </AlertDialog>
                </nav>

                <WorkSpacesList filter={filter} currentTenantId={currentTenantId} searchQuery={searchQuery} />
            </div>
        </RequireAuth>
    );
}
