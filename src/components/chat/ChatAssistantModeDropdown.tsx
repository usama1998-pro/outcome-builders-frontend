"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageSquare, RefreshCw, ChevronDown, Check, ListTodo, Search } from "lucide-react";
import type { ChatAssistantMode } from "@/src/lib/chatAgentModePreference";

type ChatAssistantModeDropdownProps = {
    value: ChatAssistantMode;
    onChange: (mode: ChatAssistantMode) => void;
    disabled?: boolean;
};

export function ChatAssistantModeDropdown({
    value,
    onChange,
    disabled,
}: ChatAssistantModeDropdownProps) {
    const isOperator = value === "operator";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    className="h-8 px-3 rounded-lg text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 min-w-[7.5rem] justify-between"
                >
                    <span className="inline-flex items-center gap-1.5">
                        {isOperator ? (
                            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                        )}
                        {isOperator ? "Operator" : "Ask"}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-60 shrink-0" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                    onClick={() => onChange("ask")}
                    className="flex items-center gap-2 cursor-pointer"
                >
                    <MessageSquare className="w-3.5 h-3.5 text-[#DB2B30] shrink-0" />
                    <span className="font-medium flex-1">Ask</span>
                    {value === "ask" && (
                        <Check className="w-3.5 h-3.5 ml-auto shrink-0 text-[#DB2B30]" />
                    )}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => onChange("operator")}
                    className="flex items-center gap-2 cursor-pointer"
                >
                    <RefreshCw className="w-3.5 h-3.5 text-[#DB2B30] shrink-0" />
                    <span className="font-medium flex-1">Operator</span>
                    {value === "operator" && (
                        <Check className="w-3.5 h-3.5 ml-auto shrink-0 text-[#DB2B30]" />
                    )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled className="flex items-start gap-2 py-2.5 opacity-60">
                    <ListTodo className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <span className="font-medium leading-none">Plan</span>
                        <span className="text-xs text-muted-foreground">Coming soon</span>
                    </div>
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="flex items-start gap-2 py-2.5 opacity-60">
                    <Search className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <span className="font-medium leading-none">Researcher</span>
                        <span className="text-xs text-muted-foreground">Coming soon</span>
                    </div>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
