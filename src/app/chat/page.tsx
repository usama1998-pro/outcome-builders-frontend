"use client";

import { Button } from "@/components/ui/button";
import {
    Send,
    ChevronDown,
    Paperclip,
    AtSign,
    SlidersHorizontal,
    Image as ImageIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/src/hooks/useProfile";

interface QuickActionProps {
    href: string;
    label: string;
    delay: number;
}

function QuickAction({ href, label, delay }: QuickActionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 + delay * 0.08 }}
        >
            <Link
                href={href}
                className="inline-flex items-center px-4 py-2 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-sm text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors shadow-sm"
            >
                {label}
            </Link>
        </motion.div>
    );
}

// 4-pointed star SVG component
function FourPointedStar({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
        >
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
        </svg>
    );
}

export default function Chat() {
    const router = useRouter();
    const [inputValue, setInputValue] = useState("");
    const { data: userProfile } = useUserProfile();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "morning";
        if (hour < 18) return "afternoon";
        return "evening";
    };

    const timeOfDay = getGreeting();
    const firstName = userProfile?.data?.full_name
        ? userProfile.data.full_name.split(" ")[0]
        : null;
    const headingText = firstName
        ? `Good ${timeOfDay}, ${firstName}`
        : `Good ${timeOfDay}`;

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
        sessionStorage.setItem("pendingChatAgentMode", "false");
        
        // Navigate to new chat - the chat page will handle creating the tab and streaming
        router.push("/chat/new");
    };

    const quickActions = [
        { href: "/dashboard/workspaces", label: "Build Workspace" },
        { href: "/chat/new", label: "Plan & Work" },
        { href: "/chat/new", label: "Research" },
        { href: "/dashboard/collections", label: "Organize Files" },
        { href: "/chat/new", label: "Create Prompt" },
    ];

    return (
        <div className="flex flex-col justify-center items-center min-h-screen w-full px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
            {/* Main Heading */}
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-3 mb-10"
            >
                <FourPointedStar className="w-6 h-6 text-[#2D4739] dark:text-emerald-400" />
                <h1 className="text-3xl sm:text-4xl font-semibold text-neutral-900 dark:text-white tracking-tight">
                    {headingText}
                </h1>
            </motion.div>
            
            {/* Input Container */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="w-full max-w-xl mb-8"
            >
                <form
                    onSubmit={handleSubmit}
                    className="relative"
                    noValidate
                >
                    <div className="flex flex-col rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg overflow-hidden">
                        {/* Input Row */}
                        <div className="flex items-center px-5 py-4">
                            <Input
                                type="text"
                                placeholder="Plan, @ for context, / for commands"
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
                                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-[15px] text-neutral-700 dark:text-neutral-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 px-2 py-2"
                            />
                        </div>

                        {/* Bottom Row - Icons and Controls */}
                        <div className="flex items-center justify-between px-4 py-2.5 border-t border-neutral-100 dark:border-neutral-800">
                            {/* Left icons */}
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                    title="Attach file"
                                >
                                    <Paperclip className="w-[18px] h-[18px]" />
                                </button>
                                <button
                                    type="button"
                                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                    title="Add context"
                                >
                                    <AtSign className="w-[18px] h-[18px]" />
                                </button>
                                <button
                                    type="button"
                                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                    title="Upload image"
                                >
                                    <ImageIcon className="w-[18px] h-[18px]" />
                                </button>
                                <button
                                    type="button"
                                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                    title="Settings"
                                >
                                    <SlidersHorizontal className="w-[18px] h-[18px]" />
                                </button>
                            </div>

                            {/* Right controls */}
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-3 rounded-lg text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                >
                                    Auto
                                    <ChevronDown className="w-3.5 h-3.5 ml-1.5 opacity-60" />
                                </Button>

                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={!inputValue.trim()}
                                    className="h-9 w-9 rounded-full bg-[#2D4739] hover:bg-[#243B2E] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white disabled:opacity-30 disabled:bg-neutral-200 dark:disabled:bg-neutral-700 disabled:text-neutral-400 dark:disabled:text-neutral-500 transition-all"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </motion.div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2.5 justify-center max-w-xl">
                {quickActions.map((action, index) => (
                    <QuickAction
                        key={action.label}
                        href={action.href}
                        label={action.label}
                        delay={index}
                    />
                ))}
            </div>
        </div>
    );
}
