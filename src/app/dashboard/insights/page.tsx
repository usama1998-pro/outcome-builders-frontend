"use client";

import RequireAuth from "@/src/components/auth/requireAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Lightbulb,
    Radio,
    Users,
    Crosshair,
    LineChart,
    Gauge,
    Rocket,
} from "lucide-react";

const INSIGHT_OPTIONS = [
    {
        id: "market-signals",
        title: "Market Signals",
        tagline: "See what everyone else is missing",
        description:
            "Identify early signals in the market before they become obvious trends. This includes emerging topics, shifts in attention, new entrants, and changing behavior patterns that indicate where the market is moving next.",
        icon: Radio,
    },
    {
        id: "market-players",
        title: "Market Players",
        tagline: "Know who matters and how they move",
        description:
            "Monitor the key players in your space, how they are performing, and how their actions evolve over time. This helps you understand whether their movements represent a threat, a benchmark, or an opportunity to differentiate.",
        icon: Users,
    },
    {
        id: "market-position",
        title: "Market Position",
        tagline: "Understand where you stand",
        description:
            "Position your brand relative to competitors and category movements. Determine whether you are gaining share, maintaining your position, or losing ground over time.",
        icon: Crosshair,
    },
    {
        id: "market-dynamics",
        title: "Market Dynamics",
        tagline: "Understand how the market behaves",
        description:
            "Analyze whether the category is growing, stagnating, or declining, and at what rate. This reveals where growth can realistically come from and how aggressive your targets can be.",
        icon: LineChart,
    },
    {
        id: "market-readiness",
        title: "Market Readiness",
        tagline: "Identify when demand is active",
        description:
            "Understand when and where buyers are entering the market. Use signals such as branded search and category demand to determine how many people are actively looking for a solution and how effectively you are capturing that demand.",
        icon: Gauge,
    },
    {
        id: "market-opportunity",
        title: "Market Opportunity",
        tagline: "Identify where growth can be captured",
        description:
            "Evaluate whether you are reaching the right audience, increasing visibility, and converting attention into demand. This reveals where untapped potential exists and where effort should be focused to drive growth.",
        icon: Rocket,
    },
] as const;

export default function InsightsPage() {
    return (
        <RequireAuth>
            <div className="flex min-h-full w-full flex-col bg-background">
                {/* Header — matches main Dashboard (page.tsx) */}
                <div className="px-8 pt-8 pb-6">
                    <div className="mb-2 flex items-center gap-3">
                        <div className="rounded-lg bg-red-500/10 p-2">
                            <Lightbulb className="h-5 w-5 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold">Insights</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Six lenses on how your business performs relative to the market.
                    </p>
                </div>

                <div className="px-8 pb-8">
                    <h2 className="mb-5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Components
                    </h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                        {INSIGHT_OPTIONS.map((opt) => {
                            const Icon = opt.icon;
                            return (
                                <Card
                                    key={opt.id}
                                    id={opt.id}
                                    className="scroll-mt-24 border border-red-500/20 bg-card shadow-sm"
                                >
                                    <CardHeader className="gap-3 pb-0">
                                        <div className="flex items-start gap-4">
                                            <div
                                                className="shrink-0 rounded-lg border border-red-500/20 bg-red-500/10 p-2"
                                                aria-hidden
                                            >
                                                <Icon className="h-5 w-5 text-red-500" />
                                            </div>
                                            <div className="min-w-0 space-y-1.5 pt-0.5">
                                                <CardTitle className="text-lg font-bold leading-snug text-foreground">
                                                    {opt.title}
                                                </CardTitle>
                                                <CardDescription className="text-sm font-semibold text-muted-foreground">
                                                    {opt.tagline}
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <p className="text-sm leading-relaxed text-muted-foreground">{opt.description}</p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>
        </RequireAuth>
    );
}
