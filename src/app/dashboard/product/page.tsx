"use client";

import RequireAuth from "@/src/components/auth/requireAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Target, Map, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ProductPage() {
    const productTools = [
        {
            id: "product-strategy",
            title: "Product Strategy Planner",
            description: "Develop comprehensive product strategies aligned with business goals and market opportunities.",
            icon: Target,
            color: "green",
            gradient: "from-green-500/10 to-emerald-500/10",
            borderColor: "border-green-500/20",
            iconBg: "bg-green-500/10",
            iconColor: "text-green-500",
        },
        {
            id: "feature-prioritization",
            title: "Feature Prioritization",
            description: "Prioritize product features using data-driven frameworks to maximize value and impact.",
            icon: Package,
            color: "teal",
            gradient: "from-teal-500/10 to-cyan-500/10",
            borderColor: "border-teal-500/20",
            iconBg: "bg-teal-500/10",
            iconColor: "text-teal-500",
        },
        {
            id: "product-roadmap",
            title: "Product Roadmap Builder",
            description: "Create and visualize product roadmaps that align teams and communicate product vision.",
            icon: Map,
            color: "emerald",
            gradient: "from-emerald-500/10 to-green-500/10",
            borderColor: "border-emerald-500/20",
            iconBg: "bg-emerald-500/10",
            iconColor: "text-emerald-500",
        },
    ];

    return (
        <RequireAuth>
            <div className="flex flex-col w-full min-h-full bg-background">
                {/* Header */}
                <div className="px-8 pt-8 pb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-green-500/10">
                            <Package className="w-5 h-5 text-green-500" />
                        </div>
                        <h1 className="text-2xl font-bold">Product Tools</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Plan, prioritize, and execute your product strategy with these comprehensive tools.
                    </p>
                </div>

                {/* Tools Grid */}
                <div className="px-8 pb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {productTools.map((tool) => {
                            const Icon = tool.icon;
                            return (
                                <Card
                                    key={tool.id}
                                    className={`group relative overflow-hidden border-2 ${tool.borderColor} hover:border-green-500/40 transition-all duration-300 cursor-pointer hover:shadow-lg`}
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
                    <Card className="bg-gradient-to-br from-green-500/5 to-teal-500/5 border-green-500/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="w-5 h-5 text-green-500" />
                                About Product Tools
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                These product tools help you strategize, prioritize, and roadmap your product development. 
                                Make data-driven decisions and align your team around a clear product vision.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </RequireAuth>
    );
}

