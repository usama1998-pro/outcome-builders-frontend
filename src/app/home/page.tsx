"use client";

import Navbar from "@/src/components/Navbar/Navbar";
import { useAnalytics } from "@/src/hooks/useAnalytics";
import { 
    Layers, 
    FolderOpen, 
    FileText, 
    Users, 
    Brain,
    TrendingUp
} from "lucide-react";

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
            className={`relative overflow-hidden rounded-2xl p-6 ${gradient} transform transition-all duration-500 hover:scale-105 hover:shadow-2xl`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                <div className="absolute inset-0 transform rotate-12 translate-x-8 -translate-y-8">
                    {icon}
                </div>
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                        {icon}
                    </div>
                </div>
                <p className="text-white/80 text-sm font-medium uppercase tracking-wider mb-1">
                    {title}
                </p>
                <p className="text-4xl font-bold text-white tabular-nums">
                    {value.toLocaleString()}
                </p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                <div className="h-full bg-white/50 animate-pulse" style={{ width: '60%' }}></div>
            </div>
        </div>
    );
}

function StatCardSkeleton() {
    return (
        <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse">
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-white/20 w-12 h-12"></div>
                </div>
                <div className="h-4 bg-white/20 rounded w-24 mb-3"></div>
                <div className="h-10 bg-white/20 rounded w-20"></div>
            </div>
        </div>
    );
}

export default function Home() {
    const { data: analytics, isLoading, isError } = useAnalytics();

    const stats = analytics ? [
        {
            title: "Workspaces",
            value: analytics.total_workspaces,
            icon: <Layers className="w-6 h-6 text-white" />,
            gradient: "bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500",
        },
        {
            title: "Collections",
            value: analytics.total_collections,
            icon: <FolderOpen className="w-6 h-6 text-white" />,
            gradient: "bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500",
        },
        {
            title: "Notes",
            value: analytics.total_notes,
            icon: <FileText className="w-6 h-6 text-white" />,
            gradient: "bg-gradient-to-br from-amber-500 via-orange-500 to-red-500",
        },
        {
            title: "Admins",
            value: analytics.total_members,
            icon: <Users className="w-6 h-6 text-white" />,
            gradient: "bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500",
        },
        {
            title: "Trained Notes",
            value: analytics.total_trained_notes,
            icon: <Brain className="w-6 h-6 text-white" />,
            gradient: "bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500",
        },
    ] : [];

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
                {/* Hero Section */}
                <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-500/10 via-transparent to-transparent pointer-events-none"></div>
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5Qzk2QjIiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDEyek0zNiAyNnYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50 pointer-events-none"></div>
                    
                    <div className="relative max-w-7xl mx-auto px-6 py-16">
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
                                <TrendingUp className="w-4 h-4 text-violet-500" />
                                <span className="text-sm font-medium text-violet-600 dark:text-violet-400">Analytics Overview</span>
                            </div>
                            <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent mb-4">
                                Outcome Builder
                            </h1>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                Your central hub for managing knowledge, notes, and team collaboration.
                                Track your progress and insights at a glance.
                            </p>
                        </div>

                        {/* Analytics Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                            {isLoading ? (
                                <>
                                    <StatCardSkeleton />
                                    <StatCardSkeleton />
                                    <StatCardSkeleton />
                                    <StatCardSkeleton />
                                    <StatCardSkeleton />
                                </>
                            ) : isError ? (
                                <div className="col-span-full text-center py-12">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
                                        <FileText className="w-8 h-8 text-red-500" />
                                    </div>
                                    <p className="text-muted-foreground">Unable to load analytics. Please try again later.</p>
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
                </div>

                {/* Welcome Section */}
                <div className="max-w-7xl mx-auto px-6 py-16">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl font-bold mb-4">Welcome to Your Dashboard</h2>
                            <p className="text-muted-foreground mb-6 leading-relaxed">
                                Outcome Builder helps you organize your knowledge, collaborate with your team,
                                and leverage AI-powered insights from your trained notes. Get started by exploring
                                your workspaces or creating new collections.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <a 
                                    href="/dashboard" 
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity"
                                >
                                    <Layers className="w-5 h-5" />
                                    Go to Dashboard
                                </a>
                                <a 
                                    href="/chat" 
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-muted hover:bg-muted/80 font-medium transition-colors"
                                >
                                    <Brain className="w-5 h-5" />
                                    Start Chat
                                </a>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
                            <div className="relative bg-card rounded-3xl border p-8 shadow-xl">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                                        <Layers className="w-8 h-8 text-violet-500 mb-2" />
                                        <p className="font-semibold">Organize</p>
                                        <p className="text-sm text-muted-foreground">Structure your knowledge</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                        <FolderOpen className="w-8 h-8 text-emerald-500 mb-2" />
                                        <p className="font-semibold">Collect</p>
                                        <p className="text-sm text-muted-foreground">Group related notes</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                        <FileText className="w-8 h-8 text-amber-500 mb-2" />
                                        <p className="font-semibold">Document</p>
                                        <p className="text-sm text-muted-foreground">Capture insights</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                        <Brain className="w-8 h-8 text-blue-500 mb-2" />
                                        <p className="font-semibold">Train AI</p>
                                        <p className="text-sm text-muted-foreground">Power your assistant</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="border-t bg-muted/30">
                    <div className="max-w-7xl mx-auto px-6 py-12">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="text-center md:text-left">
                                <h3 className="font-bold text-lg mb-1">Outcome Builder</h3>
                                <p className="text-sm text-muted-foreground">Build outcomes that matter.</p>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="text-sm text-muted-foreground">Follow us on</span>
                                <div className="flex items-center gap-4">
                                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                                    </a>
                                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/></svg>
                                    </a>
                                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
