"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, PlayCircle } from "lucide-react";

type RoadmapTaskStatus = "not_started" | "in_progress" | "completed";

interface RoadmapTask {
    id: number;
    title: string;
    week: string;
    level: string;
    status: RoadmapTaskStatus;
}

const ROADMAP_TASKS: RoadmapTask[] = [
    {
        id: 1,
        title: "Complete onboarding form",
        week: "Week 1 – Welcome + Orientation",
        level: "Orientation",
        status: "completed",
    },
    {
        id: 2,
        title: "Review vision, mission, and model",
        week: "Week 1 – Welcome + Orientation",
        level: "Orientation",
        status: "in_progress",
    },
    {
        id: 3,
        title: "Design first offer",
        week: "Week 2 – Offer Foundations",
        level: "Level 0",
        status: "not_started",
    },
    {
        id: 4,
        title: "Set up tracking & analytics",
        week: "Week 3 – Data & Feedback",
        level: "Level 0",
        status: "not_started",
    },
];

const getOverallProgress = (tasks: RoadmapTask[]) => {
    if (!tasks.length) return 0;
    const completed = tasks.filter((t) => t.status === "completed").length;
    return Math.round((completed / tasks.length) * 100);
};

const STATUS_CONFIG: Record<
    RoadmapTaskStatus,
    { label: string; color: string; icon: React.ReactElement }
> = {
    completed: {
        label: "Completed",
        color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30",
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
    },
    in_progress: {
        label: "In Progress",
        color: "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30",
        icon: <PlayCircle className="h-4 w-4 text-amber-500" />,
    },
    not_started: {
        label: "Not Started",
        color: "bg-muted text-muted-foreground border-muted",
        icon: <Circle className="h-4 w-4 text-muted-foreground" />,
    },
};

export default function RoadmapPage() {
    const overall = getOverallProgress(ROADMAP_TASKS);

    return (
        <div className="flex flex-col w-full h-screen bg-background overflow-hidden">
            <div className="px-8 pt-6 pb-4 border-b flex-shrink-0 bg-background/80 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Implementation Checklist
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                            A step‑by‑step roadmap so you always know exactly what to do next.
                        </p>
                    </div>
                    <Button size="sm" variant="outline">
                        Export Checklist
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6">
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Overall Progress */}
                    <Card className="border border-border/60 shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between gap-4">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Overall Progress
                                </CardTitle>
                                <span className="text-xs text-muted-foreground">
                                    {overall}% complete • {ROADMAP_TASKS.filter((t) => t.status === "completed").length} of{" "}
                                    {ROADMAP_TASKS.length} tasks completed
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 pb-4">
                            <div className="h-3 rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 via-lime-400 to-amber-400 transition-all"
                                    style={{ width: `${overall}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tasks Table */}
                    <Card className="border border-border/60 shadow-sm">
                        <CardHeader className="border-b pb-3">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-base font-semibold">
                                        Month 1 – Orientation, Vision + Model
                                    </CardTitle>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Work through each milestone in order. Mark tasks complete as you go.
                                    </p>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {overall}% complete
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground border-b pb-2 mb-3">
                                <div className="col-span-4">Implementation Milestone</div>
                                <div className="col-span-2">Week</div>
                                <div className="col-span-2">Level</div>
                                <div className="col-span-2">Status</div>
                                <div className="col-span-2 text-right">Action</div>
                            </div>

                            <div className="space-y-2">
                                {ROADMAP_TASKS.map((task) => {
                                    const cfg = STATUS_CONFIG[task.status];
                                    return (
                                        <div
                                            key={task.id}
                                            className="grid grid-cols-12 items-center rounded-md border border-border/40 px-3 py-2 text-xs bg-card/60 hover:bg-accent/40 transition-colors"
                                        >
                                            <div className="col-span-4 flex items-center gap-2">
                                                {cfg.icon}
                                                <span className="truncate">{task.title}</span>
                                            </div>
                                            <div className="col-span-2 text-muted-foreground">
                                                {task.week}
                                            </div>
                                            <div className="col-span-2">
                                                <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                                                    {task.level}
                                                </Badge>
                                            </div>
                                            <div className="col-span-2">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${cfg.color}`}
                                                >
                                                    {cfg.label}
                                                </span>
                                            </div>
                                            <div className="col-span-2 flex justify-end">
                                                <Button
                                                    size="sm"
                                                    variant={task.status === "completed" ? "outline" : "default"}
                                                    className="h-6 text-[11px] px-2"
                                                >
                                                    {task.status === "completed" ? "Review" : "Start Here →"}
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}


