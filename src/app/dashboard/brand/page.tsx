"use client";

import RequireAuth from "@/src/components/auth/requireAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Palette, Sparkles, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function BrandPage() {
    const brandTools = [
        {
            id: "brand-identity",
            title: "Brand Identity Builder",
            description: "Define and develop your brand's visual identity, including logos, color palettes, and design elements.",
            icon: Palette,
            color: "pink",
            gradient: "from-pink-500/10 to-rose-500/10",
            borderColor: "border-pink-500/20",
            iconBg: "bg-pink-500/10",
            iconColor: "text-pink-500",
        },
        {
            id: "brand-voice",
            title: "Brand Voice & Messaging",
            description: "Establish your brand's tone, voice, and messaging framework to ensure consistent communication.",
            icon: Sparkles,
            color: "purple",
            gradient: "from-purple-500/10 to-violet-500/10",
            borderColor: "border-purple-500/20",
            iconBg: "bg-purple-500/10",
            iconColor: "text-purple-500",
        },
        {
            id: "brand-guidelines",
            title: "Brand Guidelines Generator",
            description: "Create comprehensive brand guidelines that document your brand standards and usage rules.",
            icon: FileText,
            color: "fuchsia",
            gradient: "from-fuchsia-500/10 to-pink-500/10",
            borderColor: "border-fuchsia-500/20",
            iconBg: "bg-fuchsia-500/10",
            iconColor: "text-fuchsia-500",
        },
    ];

    return (
        <RequireAuth>
            <div className="flex flex-col w-full min-h-full bg-background">
                {/* Header */}
                <div className="px-8 pt-8 pb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-pink-500/10">
                            <Palette className="w-5 h-5 text-pink-500" />
                        </div>
                        <h1 className="text-2xl font-bold">Brand Tools</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Build and manage your brand identity with these powerful tools.
                    </p>
                </div>

                {/* Tools Grid */}
                <div className="px-8 pb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {brandTools.map((tool) => {
                            const Icon = tool.icon;
                            return (
                                <Card
                                    key={tool.id}
                                    className={`group relative overflow-hidden border-2 ${tool.borderColor} hover:border-pink-500/40 transition-all duration-300 cursor-pointer hover:shadow-lg`}
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
                    <Card className="bg-gradient-to-br from-pink-500/5 to-purple-500/5 border-pink-500/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-pink-500" />
                                About Brand Tools
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                These brand tools help you establish, maintain, and evolve your brand identity.
                                From visual elements to messaging frameworks, create a cohesive brand experience
                                that resonates with your audience.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </RequireAuth>
    );
}

