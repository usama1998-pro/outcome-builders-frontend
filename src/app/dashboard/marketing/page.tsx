"use client";

import RequireAuth from "@/src/components/auth/requireAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Calendar, BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function MarketingPage() {
    const marketingTools = [
        {
            id: "campaign-planner",
            title: "Campaign Planner",
            description: "Plan and organize marketing campaigns with timelines, objectives, and resource allocation.",
            icon: Calendar,
            color: "yellow",
            gradient: "from-yellow-500/10 to-amber-500/10",
            borderColor: "border-yellow-500/20",
            iconBg: "bg-yellow-500/10",
            iconColor: "text-yellow-500",
        },
        {
            id: "content-strategy",
            title: "Content Strategy Builder",
            description: "Develop comprehensive content strategies that align with your marketing goals and audience needs.",
            icon: Megaphone,
            color: "orange",
            gradient: "from-orange-500/10 to-yellow-500/10",
            borderColor: "border-orange-500/20",
            iconBg: "bg-orange-500/10",
            iconColor: "text-orange-500",
        },
        {
            id: "marketing-analytics",
            title: "Marketing Analytics Dashboard",
            description: "Track and analyze marketing performance metrics to optimize campaigns and measure ROI.",
            icon: BarChart3,
            color: "amber",
            gradient: "from-amber-500/10 to-orange-500/10",
            borderColor: "border-amber-500/20",
            iconBg: "bg-amber-500/10",
            iconColor: "text-amber-500",
        },
    ];

    return (
        <RequireAuth>
            <div className="flex flex-col w-full min-h-full bg-background">
                {/* Header */}
                <div className="px-8 pt-8 pb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-yellow-500/10">
                            <Megaphone className="w-5 h-5 text-yellow-500" />
                        </div>
                        <h1 className="text-2xl font-bold">Marketing Tools</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Plan campaigns, build content strategies, and analyze marketing performance.
                    </p>
                </div>

                {/* Tools Grid */}
                <div className="px-8 pb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {marketingTools.map((tool) => {
                            const Icon = tool.icon;
                            return (
                                <Card
                                    key={tool.id}
                                    className={`group relative overflow-hidden border-2 ${tool.borderColor} hover:border-yellow-500/40 transition-all duration-300 cursor-pointer hover:shadow-lg`}
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                                    <CardHeader className="relative z-10">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className={`p-3 rounded-xl ${tool.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                                                <Icon className={`w-6 h-6 ${tool.iconColor}`} />
                                            </div>
                                            <Badge variant="secondary" className="text-xs">
                                                Coming Soon
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-lg mb-1">{tool.title}</CardTitle>
                                        <CardDescription className="text-sm">
                                            {tool.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="relative z-10">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                                Explore Tool
                                            </span>
                                            <ArrowRight className={`w-4 h-4 ${tool.iconColor} group-hover:translate-x-1 transition-transform`} />
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Info Section */}
                <div className="px-8 pb-8">
                    <Card className="bg-gradient-to-br from-yellow-500/5 to-orange-500/5 border-yellow-500/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-yellow-500" />
                                About Marketing Tools
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                These marketing tools help you plan campaigns, develop content strategies, and measure 
                                performance. Drive growth with data-driven marketing decisions and strategic planning.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </RequireAuth>
    );
}

