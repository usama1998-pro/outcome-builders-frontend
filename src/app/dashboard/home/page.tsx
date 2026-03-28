"use client";

import RequireAuth from "@/src/components/auth/requireAuth";
import { useAnalytics } from "@/src/hooks/useAnalytics";
import {
    Layers,
    FolderOpen,
    FileText,
    Users,
    Brain,
    TrendingUp,
    ArrowRight,
    Contact,
    Target,
    Building2,
    LayoutGrid,
} from "lucide-react";
import Image from "next/image";

interface StatCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    gradient: string;
    delay: number;
}

function StatCard({ title, value, icon, gradient, delay }: StatCardProps) {
    return (
        <div
            className={`relative overflow-hidden rounded-xl p-4 ${gradient} transform transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
                <div className="absolute inset-0 transform rotate-12 translate-x-6 -translate-y-6 scale-150">
                    {icon}
                </div>
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                        {icon}
                    </div>
                </div>
                <p className="text-white/80 text-[10px] sm:text-xs font-medium uppercase tracking-wider mb-0.5 line-clamp-2">
                    {title}
                </p>
                <p className="text-2xl font-bold text-white tabular-nums leading-tight">
                    {value.toLocaleString()}
                </p>
            </div>
        </div>
    );
}

function StatCardSkeleton() {
    return (
        <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse">
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-white/20 w-9 h-9"></div>
                </div>
                <div className="h-2.5 bg-white/20 rounded w-16 mb-1.5"></div>
                <div className="h-7 bg-white/20 rounded w-14"></div>
            </div>
        </div>
    );
}

export default function DashboardHome() {
    const { data: analytics, isLoading, isError } = useAnalytics();

    const stats = [
        {
            title: "Workspaces",
            value: analytics?.total_workspaces ?? 0,
            icon: <Layers className="w-5 h-5 text-white" />,
            gradient: "bg-gradient-to-br from-[#FF6B6B] via-[#FF3B3B] to-[#E10000]",
        },
        {
            title: "Collections",
            value: analytics?.total_collections ?? 0,
            icon: <FolderOpen className="w-5 h-5 text-white" />,
            gradient: "bg-gradient-to-br from-[#FF6B6B] via-[#FF3B3B] to-[#E10000]",
        },
        {
            title: "Content",
            value: analytics?.total_notes ?? 0,
            icon: <FileText className="w-5 h-5 text-white" />,
            gradient: "bg-gradient-to-br from-[#FF6B6B] via-[#FF3B3B] to-[#E10000]",
        },
        {
            title: "Members",
            value: analytics?.total_members ?? 0,
            icon: <Users className="w-5 h-5 text-white" />,
            gradient: "bg-gradient-to-br from-[#FF6B6B] via-[#FF3B3B] to-[#E10000]",
        },
        {
            title: "Trained Content",
            value: analytics?.total_trained_notes ?? 0,
            icon: <Brain className="w-5 h-5 text-white" />,
            gradient: "bg-gradient-to-br from-[#FF6B6B] via-[#FF3B3B] to-[#E10000]",
        },
        {
            title: "Customer sources",
            value: analytics?.total_customer_context_sources ?? 0,
            icon: <Contact className="w-5 h-5 text-white" />,
            gradient: "bg-gradient-to-br from-[#FF6B6B] via-[#FF3B3B] to-[#E10000]",
        },
        {
            title: "Competitor sources",
            value: analytics?.total_competitor_context_sources ?? 0,
            icon: <Target className="w-5 h-5 text-white" />,
            gradient: "bg-gradient-to-br from-[#FF6B6B] via-[#FF3B3B] to-[#E10000]",
        },
        {
            title: "Company sources",
            value: analytics?.total_company_context_sources ?? 0,
            icon: <Building2 className="w-5 h-5 text-white" />,
            gradient: "bg-gradient-to-br from-[#FF6B6B] via-[#FF3B3B] to-[#E10000]",
        },
        {
            title: "Category sources",
            value: analytics?.total_category_context_sources ?? 0,
            icon: <LayoutGrid className="w-5 h-5 text-white" />,
            gradient: "bg-gradient-to-br from-[#FF6B6B] via-[#FF3B3B] to-[#E10000]",
        },
    ];

    return (
        <RequireAuth>
            <div className="flex flex-col w-full min-h-full bg-background">
                {/* Header */}
                <div className="px-8 pt-8 pb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-violet-500/10">
                            <TrendingUp className="w-5 h-5 text-violet-500" />
                        </div>
                        <h1 className="text-2xl font-bold">Dashboard</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Welcome back! Here&apos;s an overview of your organizati.
                    </p>
                </div>

                {/* Analytics Section */}
                <div className="px-8 pb-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 min-w-0">
                        {isLoading && !analytics ? (
                            <>
                                <StatCardSkeleton />
                                <StatCardSkeleton />
                                <StatCardSkeleton />
                                <StatCardSkeleton />
                                <StatCardSkeleton />
                                <StatCardSkeleton />
                                <StatCardSkeleton />
                                <StatCardSkeleton />
                                <StatCardSkeleton />
                            </>
                        ) : isError ? (
                            <div className="col-span-full text-center py-12 bg-muted/30 rounded-2xl border border-dashed">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mb-3">
                                    <FileText className="w-6 h-6 text-red-500" />
                                </div>
                                <p className="text-muted-foreground text-sm">Unable to load analytics</p>
                            </div>
                        ) : (
                            stats.map((stat, index) => (
                                <StatCard
                                    key={stat.title}
                                    title={stat.title}
                                    value={stat.value}
                                    icon={stat.icon}
                                    gradient={stat.gradient}
                                    delay={index * 100}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="px-8 pb-8">
                    <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <a
                            href="/dashboard/workspaces"
                            className="group flex items-center justify-between p-4 rounded-xl bg-card border hover:border-violet-500/50 hover:bg-violet-500/5 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-violet-500/10 group-hover:bg-violet-500/20 transition-colors">
                                    <Layers className="w-5 h-5 text-violet-500" />
                                </div>
                                <span className="font-medium">Workspaces</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
                        </a>

                        <a
                            href="/chat"
                            className="group flex items-center justify-between p-4 rounded-xl bg-card border hover:border-red-500/50 hover:bg-red-500/5 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors flex items-center justify-center">
                                    <Image
                                        src="/assets/black-square-Icon.png"
                                        alt="AI Chat"
                                        width={20}
                                        height={20}
                                        className="block dark:hidden"
                                    />
                                    <Image
                                        src="/assets/white-square-Icon.png"
                                        alt="AI Chat"
                                        width={20}
                                        height={20}
                                        className="hidden dark:block"
                                    />
                                </div>
                                <span className="font-medium">AI Chat</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                        </a>

                        <a
                            href="/dashboard/organization"
                            className="group flex items-center justify-between p-4 rounded-xl bg-card border hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                                    <Users className="w-5 h-5 text-emerald-500" />
                                </div>
                                <span className="font-medium">Organization</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                        </a>

                        <a
                            href="/dashboard/profile"
                            className="group flex items-center justify-between p-4 rounded-xl bg-card border hover:border-amber-500/50 hover:bg-amber-500/5 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                                    <FileText className="w-5 h-5 text-amber-500" />
                                </div>
                                <span className="font-medium">Profile</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                        </a>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="px-8 pb-8">
                    <h2 className="text-lg font-semibold mb-4">Getting Started</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-5 rounded-xl bg-gradient-to-br from-violet-500/5 to-purple-500/5 border border-violet-500/10">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-violet-500/10">
                                    <Layers className="w-6 h-6 text-violet-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Organize with Workspaces</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Create workspaces to organize your team&apos;s knowledge and collaborate effectively.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/10">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-emerald-500/10">
                                    <FolderOpen className="w-6 h-6 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Group with Collections</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Use collections to categorize related articles and keep everything structured.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 rounded-xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/10">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-amber-500/10">
                                    <FileText className="w-6 h-6 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Capture in Content</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Document insights, ideas, and information in articles with file attachments.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 rounded-xl bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border border-blue-500/10">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-blue-500/10">
                                    <Brain className="w-6 h-6 text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Train Your AI</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Mark articles as trained to power your AI assistant with your knowledge base.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </RequireAuth>
    );
}
