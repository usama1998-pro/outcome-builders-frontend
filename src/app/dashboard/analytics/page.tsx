"use client";

import { useMemo } from "react";
import RequireAuth from "@/src/components/auth/requireAuth";
import { useAnalytics } from "@/src/hooks/useAnalytics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    BarChart3,
    TrendingUp,
    Brain,
    FolderOpen,
    FileText,
    Users,
    Loader2,
    PieChart,
} from "lucide-react";

const BAR_COLORS = [
    "bg-violet-500",
    "bg-cyan-500",
    "bg-amber-500",
    "bg-emerald-500",
];

function BarChartSection({
    data,
    labels,
    title,
    maxVal,
}: {
    data: number[];
    labels: string[];
    title: string;
    maxVal: number;
}) {
    const scale = maxVal > 0 ? 100 / maxVal : 0;
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="h-5 w-5 text-indigo-500" />
                    {title}
                </CardTitle>
                <CardDescription>Content and usage distribution</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {data.map((value, i) => (
                        <div key={labels[i]} className="space-y-1.5">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-muted-foreground">{labels[i]}</span>
                                <span className="tabular-nums font-medium">{value.toLocaleString()}</span>
                            </div>
                            <div className="h-8 rounded-lg bg-muted overflow-hidden">
                                <div
                                    className={`h-full rounded-lg transition-all duration-500 ${BAR_COLORS[i % BAR_COLORS.length]}`}
                                    style={{ width: `${Math.max(2, value * scale)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function AdoptionChart({ trained, total }: { trained: number; total: number }) {
    const untrained = Math.max(0, total - trained);
    const totalVal = total || 1;
    const trainedPct = (trained / totalVal) * 100;
    const untrainedPct = (untrained / totalVal) * 100;
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <PieChart className="h-5 w-5 text-emerald-500" />
                    Knowledge base adoption
                </CardTitle>
                <CardDescription>Trained vs untrained articles</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex h-8 rounded-lg overflow-hidden bg-muted">
                        <div
                            className="bg-emerald-500 transition-all duration-500"
                            style={{ width: `${trainedPct}%` }}
                            title={`Trained: ${trained}`}
                        />
                        <div
                            className="bg-amber-400 transition-all duration-500"
                            style={{ width: `${untrainedPct}%` }}
                            title={`Untrained: ${untrained}`}
                        />
                    </div>
                    <div className="flex gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            <span className="text-muted-foreground">Trained</span>
                            <span className="font-medium tabular-nums">{trained}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-400" />
                            <span className="text-muted-foreground">Untrained</span>
                            <span className="font-medium tabular-nums">{untrained}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
    color,
}: {
    title: string;
    value: number;
    icon: React.ElementType;
    color: string;
}) {
    return (
        <Card className="overflow-hidden">
            <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold tabular-nums mt-1">{value.toLocaleString()}</p>
                    </div>
                    <div className={`p-2.5 rounded-lg ${color}`}>
                        <Icon className="h-5 w-5 text-white" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function AnalyticsPage() {
    const { data: analytics, isLoading } = useAnalytics();

    const chartData = useMemo(() => {
        const workspaces = analytics?.total_workspaces ?? 0;
        const collections = analytics?.total_collections ?? 0;
        const notes = analytics?.total_notes ?? 0;
        const trained = analytics?.total_trained_notes ?? 0;
        return {
            values: [workspaces, collections, notes, trained],
            labels: ["Workspaces", "Collections", "Resources", "Trained resources"],
            max: Math.max(workspaces, collections, notes, trained, 1),
        };
    }, [analytics]);

    if (isLoading) {
        return (
            <RequireAuth>
                <div className="flex flex-col w-full min-h-full items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">Loading analytics…</p>
                </div>
            </RequireAuth>
        );
    }

    return (
        <RequireAuth>
            <div className="flex flex-col w-full min-h-full bg-background">
                <div className="px-6 sm:px-8 pt-6 pb-4">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-lg bg-indigo-500/10">
                            <TrendingUp className="w-5 h-5 text-indigo-500" />
                        </div>
                        <h1 className="text-2xl font-bold">Analytics</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Business evaluation and usage overview for your organization.
                    </p>
                </div>

                <div className="px-6 sm:px-8 pb-8 space-y-8">
                    {/* KPI cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Workspaces"
                            value={analytics?.total_workspaces ?? 0}
                            icon={Brain}
                            color="bg-violet-500"
                        />
                        <StatCard
                            title="Collections"
                            value={analytics?.total_collections ?? 0}
                            icon={FolderOpen}
                            color="bg-cyan-500"
                        />
                        <StatCard
                            title="Resources"
                            value={analytics?.total_notes ?? 0}
                            icon={FileText}
                            color="bg-amber-500"
                        />
                        <StatCard
                            title="Team members"
                            value={analytics?.total_members ?? 0}
                            icon={Users}
                            color="bg-emerald-500"
                        />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <BarChartSection
                            title="Content overview"
                            data={chartData.values}
                            labels={chartData.labels}
                            maxVal={chartData.max}
                        />
                        <AdoptionChart
                            trained={analytics?.total_trained_notes ?? 0}
                            total={analytics?.total_notes ?? 0}
                        />
                    </div>

                    {/* Summary card */}
                    <Card className="bg-muted/30 border-dashed">
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">
                                Use these metrics to evaluate content growth, team size, and knowledge base adoption.
                                Increase trained articles to improve AI assistant quality.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </RequireAuth>
    );
}
