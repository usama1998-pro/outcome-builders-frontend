"use client";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronUp, User2, Building2, ChevronDown, Check, UserPlus, Users, Home, Briefcase, MessageSquare } from "lucide-react";
import { useSignOut, useUserTenants } from "@/src/hooks/useAuth";
import { useAuthStore } from "@/src/store/useAuth";

export default function SidePanel() {
    const pathname = usePathname();
    const router = useRouter();
    const signOut = useSignOut();
    const currentTenantId = useAuthStore((s) => s.tenantId);
    const setTenantId = useAuthStore((s) => s.setTenantId);
    const { data: tenants } = useUserTenants();

    // Find the current tenant
    const currentTenant = tenants?.find((t) => t.id === currentTenantId);

    const links = [
        { href: "/dashboard", label: "Home" },
        { href: "/dashboard/workspaces", label: "Workspace" },
        { href: "/chat", label: "Chat" },
    ];

    const handleTenantClick = (tenantId: number) => {
        if (tenantId !== currentTenantId) {
            setTenantId(tenantId);
        }
        // Navigate to organization page
        router.push("/dashboard/organization");
    };

    return (
        <Sidebar>
            <SidebarContent>
                {/* Organization Dropdown */}
                <SidebarGroup>
                    <SidebarGroupLabel>Organization</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <SidebarMenuButton className="w-full">
                                            <Building2 className="mr-2" />
                                            <span className="flex-1 text-left truncate">
                                                {currentTenant?.company_name || "Select Organization"}
                                            </span>
                                            <ChevronDown className="ml-auto h-4 w-4" />
                                        </SidebarMenuButton>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        side="right"
                                        align="start"
                                        className="w-[250px]"
                                    >
                                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                            Your Organizations ({tenants?.length || 0})
                                        </div>
                                        {tenants && tenants.length > 0 ? (
                                            tenants.map((tenant) => (
                                                <DropdownMenuItem
                                                    key={tenant.id}
                                                    onClick={() => handleTenantClick(tenant.id)}
                                                    className="cursor-pointer"
                                                >
                                                    <div className="flex items-center justify-between w-full">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{tenant.company_name}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                Role: {tenant.role}
                                                            </span>
                                                        </div>
                                                        {tenant.id === currentTenantId && (
                                                            <Check className="h-4 w-4 text-primary" />
                                                        )}
                                                    </div>
                                                </DropdownMenuItem>
                                            ))
                                        ) : (
                                            <DropdownMenuItem disabled>
                                                No organizations found
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </SidebarMenuItem>

                            {/* Join Organization Link */}
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link
                                        href="/register-company"
                                        className={`px-2 py-1 rounded ${pathname === "/register-company" ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
                                            }`}
                                    >
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Join Organization
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Application Links */}
                <SidebarGroup>
                    <SidebarGroupLabel>Application</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link
                                        href="/dashboard"
                                        className={`px-2 py-1 rounded ${pathname === "/dashboard" ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
                                            }`}
                                    >
                                        <Home className="mr-2 h-4 w-4" />
                                        Home
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link
                                        href="/dashboard/workspaces"
                                        className={`px-2 py-1 rounded ${pathname === "/dashboard/workspaces" ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
                                            }`}
                                    >
                                        <Briefcase className="mr-2 h-4 w-4" />
                                        Workspace
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {/* Join Workspace Link */}
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link
                                        href="/join-workspace"
                                        className={`px-2 py-1 rounded ${pathname === "/join-workspace" ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
                                            }`}
                                    >
                                        <Users className="mr-2 h-4 w-4" />
                                        Join Workspace
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link
                                        href="/chat"
                                        className={`px-2 py-1 rounded ${pathname === "/chat" ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
                                            }`}
                                    >
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        Chat
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>

                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton>
                                    <User2 /> Username
                                    <ChevronUp className="ml-auto" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="top"
                                className="w-[--radix-popper-anchor-width]"
                            >
                                <DropdownMenuItem>
                                    <Link href={'/dashboard/profile'}>Profile</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <span>Billing</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={signOut}>
                                    <span>Sign out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );


    // <div className="w-[300px] h-screen flex item-center justify-around flex-col p-10 overflow-y-auto bg-black text-white border-r-2 border-[#696E79]">
    //         <div className="height-[200px] border-[#696E79]-2 border-b-2 pb-4 mb-4">
    //             <h1 className="text-[#01C38D] text-2xl" >Company Name</h1>
    //         </div>

    //         <div className="flex flex-col gap-4">
    //             {/* <p className="text-[#01C38D] text-2xl">Home</p> */}
    //             {links.map((link) => (
    //                 <Link
    //                     key={link.href}
    //                     href={link.href}
    //                     className={`px-2 py-1 rounded ${pathname === link.href ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
    //                         }`}
    //                 >
    //                     {link.label}
    //                 </Link>
    //             ))}
    //         </div>

    //         <div className="border-t-2 border-[#696E79] pt-4">
    //             <p className="text-[#01C38D]">Muhammad Usama</p>
    //         </div>

    //     </div>
}