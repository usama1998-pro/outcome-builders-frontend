"use client";

import { Button } from "@/components/ui/button";
import {
    Send,
    Paperclip,
    AtSign,
    Globe,
    SlidersHorizontal,
    Image as ImageIcon,
    MessageCircle,
    Settings as SettingsIcon,
} from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/src/hooks/useProfile";
import { useGetUserSettings, useUpdateUserSettings } from "@/src/hooks/useUserSettings";
import { ModelSelector } from "@/src/components/chat/ModelSelector";
import {
    getStoredAssistantMode,
    setStoredAssistantMode,
    type ChatAssistantMode,
} from "@/src/lib/chatAgentModePreference";
import { CHAT_ENTRY_PATH } from "@/src/lib/chatRoutes";
import { ChatAssistantModeDropdown } from "@/src/components/chat/ChatAssistantModeDropdown";

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
                className="inline-flex items-center px-4 py-2 rounded-full border border-[#DB2B30] bg-transparent hover:bg-[#DB2B30] text-sm text-[#DB2B30] dark:text-white hover:text-white transition-colors shadow-sm"
            >
                {label}
            </Link>
        </motion.div>
    );
}

export function ChatLandingPage({
    onMessageQueued,
}: {
    /** When set (embedded under `ChatClient`), stay on `/chat` and let the parent pick up `pendingChatQuestion`. */
    onMessageQueued?: () => void;
}) {
    const router = useRouter();
    const [inputValue, setInputValue] = useState("");
    const [selectedModel, setSelectedModel] = useState<string>("default");
    const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);
    /** Operator → LangGraph agent; Ask → chat (matches /chat/[chatId]). */
    const [assistantMode, setAssistantMode] = useState<ChatAssistantMode>("ask");
    const [enabledTones, setEnabledTones] = useState<string[]>([]);
    const [customInstructions, setCustomInstructions] = useState("");
    const { data: userProfile } = useUserProfile();
    const { data: settingsData, isLoading: settingsLoading } = useGetUserSettings();
    const updateUserSettings = useUpdateUserSettings();
    const hasInitializedModelRef = useRef(false);

    useEffect(() => {
        setAssistantMode(getStoredAssistantMode());
    }, []);

    useEffect(() => {
        if (hasInitializedModelRef.current || !settingsData?.data) return;
        hasInitializedModelRef.current = true;
        const pref = settingsData.data.preferred_chat_model;
        if (pref != null && pref !== "") setSelectedModel(pref);
    }, [settingsData]);

    useEffect(() => {
        if (!settingsData?.data) return;
        if (settingsData.data.enabled_tones != null) {
            setEnabledTones(settingsData.data.enabled_tones);
        }
        setCustomInstructions(settingsData.data.custom_instructions ?? "");
    }, [settingsData?.data]);

    const handleModelChange = useCallback(
        (slug: string) => {
            setSelectedModel(slug);
            updateUserSettings.mutate({ preferred_chat_model: slug });
        },
        [updateUserSettings]
    );

    const handleToneToggle = useCallback(
        (slug: string, checked: boolean) => {
            const next = checked ? [slug] : [];
            setEnabledTones(next);
            updateUserSettings.mutate({ enabled_tones: next.length ? next : null });
        },
        [updateUserSettings]
    );

    const toneOptions: { slug: string; label: string; description: string }[] = [
        {
            slug: "informal",
            label: "Informal",
            description: "Loose, conversational wording that sounds like a real-time chat with a colleague, using everyday language and contractions.",
        },
        {
            slug: "professional",
            label: "Professional",
            description: "Polished, confident language that feels business-ready without being stiff, with clear structure and measured wording.",
        },
        {
            slug: "concise",
            label: "Concise",
            description: "Short, efficient sentences that strip away filler and focus on the essential points so readers can scan quickly.",
        },
        {
            slug: "friendly",
            label: "Friendly",
            description: "Warm, welcoming language that feels supportive and encouraging, with soft edges and inclusive phrasing.",
        },
        {
            slug: "formal",
            label: "Formal",
            description: "Structured, respectful language that avoids slang and contractions, similar to a report or official communication.",
        },
        {
            slug: "technical",
            label: "Technical",
            description: "Precise terminology and domain-specific language that focuses on how things work, assuming some subject familiarity.",
        },
        {
            slug: "empathetic",
            label: "Empathetic",
            description: "Gentle, validating language that acknowledges emotions first and then moves into guidance or solutions.",
        },
        {
            slug: "direct",
            label: "Direct",
            description: "Straight-to-the-point language that says what needs to be said clearly, with minimal softening or extra context.",
        },
    ];

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return "morning";
        if (hour >= 12 && hour < 18) return "afternoon";
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

        sessionStorage.setItem("pendingChatQuestion", question);
        sessionStorage.setItem("pendingChatAssistantMode", assistantMode);
        sessionStorage.removeItem("pendingChatAgentMode");
        setStoredAssistantMode(assistantMode);

        if (onMessageQueued) {
            onMessageQueued();
        } else {
            router.push(CHAT_ENTRY_PATH);
        }
    };

    const quickActions = [
        { href: "/dashboard/workspaces", label: "Build Workspace" },
        { href: CHAT_ENTRY_PATH, label: "Plan & Work" },
        { href: CHAT_ENTRY_PATH, label: "Research" },
        { href: "/dashboard/collections", label: "Organize Files" },
        { href: CHAT_ENTRY_PATH, label: "Create Prompt" },
    ];

    return (
        <div className="flex flex-col justify-center items-center min-h-full w-full px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-10 flex flex-col items-center gap-3"
            >
                <div className="inline-flex items-center justify-center">
                    <Image
                        src="/assets/black-square-Icon.png"
                        alt="AI"
                        width={64}
                        height={64}
                        className="block dark:hidden"
                    />
                    <Image
                        src="/assets/white-square-Icon.png"
                        alt="AI"
                        width={64}
                        height={64}
                        className="hidden dark:block"
                    />
                </div>
                <h1 className="text-3xl sm:text-4xl font-semibold text-black dark:text-white tracking-tight text-center">
                    {headingText}
                </h1>
            </motion.div>

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
                                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-[15px] text-black dark:text-neutral-200 placeholder:text-black dark:placeholder:text-neutral-500 px-2 py-2"
                            />
                        </div>

                        <div className="flex items-center justify-between px-4 py-2.5 border-t border-neutral-100 dark:border-neutral-800">
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
                                    title="Web search"
                                >
                                    <Globe className="w-[18px] h-[18px]" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSettingsSheetOpen(true)}
                                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                    title="Settings"
                                >
                                    <SlidersHorizontal className="w-[18px] h-[18px]" />
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <div
                                    className="flex items-center pr-2 mr-0.5 border-r border-neutral-200 dark:border-neutral-700"
                                    title={
                                        assistantMode === "operator"
                                            ? "Operator: structured steps and KB graph"
                                            : "Ask: standard chat reply"
                                    }
                                >
                                    <ChatAssistantModeDropdown
                                        value={assistantMode}
                                        onChange={(mode) => {
                                            setAssistantMode(mode);
                                            setStoredAssistantMode(mode);
                                        }}
                                    />
                                </div>
                                <ModelSelector
                                    value={selectedModel}
                                    onChange={handleModelChange}
                                />

                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={!inputValue.trim()}
                                    className="h-9 w-9 rounded-full bg-[#DB2B30] hover:bg-[#B52227] dark:bg-[#DB2B30] dark:hover:bg-[#B52227] text-white disabled:opacity-30 disabled:bg-neutral-200 dark:disabled:bg-neutral-700 disabled:text-neutral-400 dark:disabled:text-neutral-500 transition-all"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </motion.div>

            <Sheet open={settingsSheetOpen} onOpenChange={setSettingsSheetOpen}>
                <SheetContent side="right" className="w-full sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <SettingsIcon className="h-5 w-5" />
                            Tone response
                        </SheetTitle>
                        <SheetDescription>
                            Choose how you want the assistant to sound when it writes for you. This is about the overall voice and feel of the messages, not just a single label.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="px-4 pb-4 space-y-6 overflow-y-auto">
                        <div className="space-y-3">
                            <Label htmlFor="landing-custom-instructions" className="text-sm font-medium">
                                Custom instructions
                            </Label>
                            <p className="text-xs text-black dark:text-muted-foreground">
                                Tell the assistant how to respond in every conversation. This will be sent with each message.
                            </p>
                            <textarea
                                id="landing-custom-instructions"
                                value={customInstructions}
                                onChange={(e) => setCustomInstructions(e.target.value)}
                                rows={4}
                                maxLength={2000}
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-black dark:text-foreground outline-none focus:ring-2 focus:ring-[#DB2B30] focus:border-transparent resize-none"
                                disabled={settingsLoading || updateUserSettings.isPending}
                            />
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{2000 - customInstructions.length} characters remaining</span>
                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={settingsLoading || updateUserSettings.isPending}
                                    onClick={() =>
                                        updateUserSettings.mutate({
                                            custom_instructions: customInstructions.trim(),
                                        })
                                    }
                                >
                                    Save instructions
                                </Button>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-black dark:text-muted-foreground mb-3 flex items-start gap-2">
                                <MessageCircle className="h-4 w-4 mt-0.5" />
                                Choose the tone that best matches your brand’s voice. Think about how it should actually read on the page—its energy, pacing, and personality—
                                so you can keep communication consistent across everything you write.
                            </p>
                            <div className="space-y-4">
                                {toneOptions.map(({ slug, label, description }) => (
                                    <div key={slug} className="flex items-center justify-between gap-4">
                                        <div className="flex-1 space-y-0.5">
                                            <Label htmlFor={`landing-tone-${slug}`} className="text-sm font-medium cursor-pointer">
                                                {label}
                                            </Label>
                                            <p className="text-xs text-black dark:text-muted-foreground">
                                                {description}
                                            </p>
                                        </div>
                                        <Switch
                                            id={`landing-tone-${slug}`}
                                            checked={enabledTones.includes(slug)}
                                            onCheckedChange={(checked) => handleToneToggle(slug, checked)}
                                            disabled={settingsLoading || updateUserSettings.isPending}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

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
