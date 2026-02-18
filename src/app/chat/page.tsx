"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Building, Brain, FolderPlus, MessageCircle, PlusCircle, Send, Share2, Sparkles, MessageSquare, Star, ChevronDown, Check, RefreshCw, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import BlurText from "../../../components/BlurText";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { streamChat } from "../../api/chat";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/src/store/useAuth";
import { useOrganizationDetails } from "@/src/hooks/useOrganization";

interface QuickActionProps {
    href: string;
    icon: React.ReactNode;
    label: string;
    gradient: string;
    delay: number;
}

function QuickAction({ href, icon, label, gradient, delay }: QuickActionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: delay * 0.1 }}
        >
            <Link
                href={href}
                className={`group relative flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl border bg-card/50 backdrop-blur-sm hover:bg-card hover:border-transparent transition-all duration-300 overflow-hidden`}
            >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${gradient}`} />
                
                <span className="relative z-10 text-muted-foreground group-hover:text-white transition-colors">
                    {icon}
                </span>
                <span className="relative z-10 text-sm font-medium group-hover:text-white transition-colors">
                    {label}
                </span>
            </Link>
        </motion.div>
    );
}

export default function Chat() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [inputValue, setInputValue] = useState("");
    const [agentMode, setAgentMode] = useState(false);
    const currentTenantId = useAuthStore((s) => s.tenantId);
    const { data: organization } = useOrganizationDetails(currentTenantId || 0);

    const handleAnimationComplete = () => {
        console.log('Animation completed!');
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!inputValue.trim()) {
            return;
        }

        const question = inputValue.trim();
        setInputValue("");

        // Store the question in sessionStorage so the chat page can pick it up
        sessionStorage.setItem("pendingChatQuestion", question);
        sessionStorage.setItem("pendingChatAgentMode", String(agentMode));
        
        // Navigate to new chat - the chat page will handle creating the tab and streaming
        router.push("/chat/new");
    };

    const quickActions = [
        {
            href: "/dashboard/organization",
            icon: <Building className="h-4 w-4" />,
            label: "Organization",
            gradient: "bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500",
        },
        {
            href: "/dashboard/workspaces",
            icon: <Brain className="h-4 w-4" />,
            label: "Brainspaces",
            gradient: "bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500",
        },
        {
            href: "/workspaces/create",
            icon: <FolderPlus className="w-4 h-4" />,
            label: "Join Workspace",
            gradient: "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500",
        },
        {
            href: "/share",
            icon: <Share2 className="w-4 h-4" />,
            label: "Share",
            gradient: "bg-gradient-to-br from-amber-500 via-orange-500 to-red-500",
        },
    ];

    return (
        <div className="flex flex-col justify-center items-center min-h-screen w-full px-4 sm:px-6 lg:px-8 relative">
            {/* Watermark Logo Background - At the top, above text */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-none z-0 mb-16">
                {organization?.logo ? (
                    <img 
                        src={organization.logo} 
                        alt={`${organization.company_name} logo watermark`}
                        className="w-48 h-48 object-contain opacity-[0.15] dark:opacity-[0.20] grayscale dark:brightness-150"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                        }}
                    />
                ) : (
                    <div className="w-48 h-48 flex items-center justify-center opacity-[0.12] dark:opacity-[0.15]">
                        <Building2 className="w-full h-full text-muted-foreground" strokeWidth={0.5} />
                    </div>
                )}
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Main Heading - Add top margin to create space below watermark */}
            <div className="mt-32">
                <BlurText
                    text="What's on your mind today?"
                    delay={150}
                    animateBy="words"
                    direction="top"
                    onAnimationComplete={handleAnimationComplete}
                    className="text-2xl sm:text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text mb-2"
                />
            </div>
            
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-muted-foreground text-center mb-8 max-w-md text-sm sm:text-base"
            >
                Ask questions, get insights from your trained articles, and explore your knowledge base.
            </motion.p>

            {/* Chat Input - Same UI as chat page */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="w-full max-w-4xl mb-8"
            >
                <form 
                    onSubmit={handleSubmit}
                    className="relative"
                    noValidate
                >
                    {/* Input Container - like ChatGPT/Cursor */}
                    <div className="relative bg-card border rounded-2xl shadow-lg overflow-hidden">
                        {/* Input Row */}
                        <div className="flex items-center gap-2 p-1.5 sm:p-2">
                            <Input
                                type="text"
                                placeholder="Type your message..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        if (inputValue.trim()) {
                                            handleSubmit(e as any);
                                        }
                                    }
                                }}
                                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-3"
                            />
                            <Button 
                                type="submit"
                                size="icon"
                                disabled={!inputValue.trim()}
                                className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 dark:from-violet-500 dark:via-purple-500 dark:to-indigo-500 hover:opacity-90 transition-opacity shadow-md !text-white flex-shrink-0 disabled:opacity-50"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-border/50" />

                        {/* Dropdown Row - Inside container, below input */}
                        <div className="flex items-center justify-between px-3 sm:px-4 py-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        {agentMode ? (
                                            <>
                                                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                                                Agent Mode
                                            </>
                                        ) : (
                                            <>
                                                <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                                                Chat Mode
                                            </>
                                        )}
                                        <ChevronDown className="w-3 h-3 ml-1.5 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-40">
                                    <DropdownMenuItem
                                        onClick={() => setAgentMode(false)}
                                        className="flex items-center gap-2 cursor-pointer"
                                    >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        <span>Chat Mode</span>
                                        {!agentMode && <Check className="w-3 h-3 ml-auto text-emerald-500" />}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setAgentMode(true)}
                                        className="flex items-center gap-2 cursor-pointer"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        <span>Agent Mode</span>
                                        {agentMode && <Check className="w-3 h-3 ml-auto text-emerald-500" />}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Helper text with star */}
                            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground/60">
                                <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-yellow-400 text-yellow-400 drop-shadow-sm" />
                                <span>AI responses are based on your trained articles</span>
                            </div>
                        </div>
                    </div>
                </form>
            </motion.div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
                {quickActions.map((action, index) => (
                    <QuickAction
                        key={action.label}
                        href={action.href}
                        icon={action.icon}
                        label={action.label}
                        gradient={action.gradient}
                        delay={index}
                    />
                ))}
            </div>

            {/* Subtle hint */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
                <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                    <MessageCircle className="w-3 h-3" />
                    <span>Start a conversation to get AI-powered insights</span>
                </div>
            </motion.div>
        </div>
    );
}
