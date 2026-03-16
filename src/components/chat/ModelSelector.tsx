"use client";

import React, { useState, useMemo, useCallback } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CHAT_MODEL_OPTIONS,
  CHAT_MODEL_CATEGORIES,
  getModelDisplayLabel,
  type ChatModelOption,
} from "@/src/lib/chatModels";
import { cn } from "@/lib/utils";

interface ModelSelectorProps {
  value: string;
  onChange: (slug: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ModelSelector({
  value,
  onChange,
  disabled = false,
  className,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CHAT_MODEL_OPTIONS;
    return CHAT_MODEL_OPTIONS.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || o.slug.toLowerCase().includes(q)
    );
  }, [search]);

  const byCategory = useMemo(() => {
    const map: Record<string, ChatModelOption[]> = {};
    for (const cat of CHAT_MODEL_CATEGORIES) {
      map[cat] = filtered.filter((o) => o.category === cat);
    }
    return map;
  }, [filtered]);

  const handleSelect = useCallback(
    (slug: string) => {
      onChange(slug);
      setOpen(false);
      setSearch("");
    },
    [onChange]
  );

  const displayLabel = getModelDisplayLabel(value);

  return (
    <TooltipProvider>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            className={cn(
              "h-8 px-3 rounded-lg text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800",
              className
            )}
          >
            <span className="truncate max-w-[100px]">{displayLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 ml-1.5 opacity-60 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-56 p-0"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="p-2 border-b border-neutral-200 dark:border-neutral-700">
            <Input
              placeholder="Search models…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm"
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-[280px] overflow-y-auto overscroll-contain">
            {CHAT_MODEL_CATEGORIES.map((cat) => {
              const options = byCategory[cat];
              if (!options.length) return null;
              return (
                <div key={cat} className="py-1">
                  <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    {cat}
                  </div>
                  {options.map((opt) => {
                    const isSelected = value === opt.slug;
                    const content = (
                      <button
                        type="button"
                        onClick={() => handleSelect(opt.slug)}
                        className={cn(
                          "w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left outline-none hover:bg-neutral-100 dark:hover:bg-neutral-800",
                          isSelected && "bg-neutral-100 dark:bg-neutral-800"
                        )}
                      >
                        <span className="flex-1 truncate">{opt.label}</span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        )}
                      </button>
                    );
                    if (opt.slug === "auto" && opt.description) {
                      return (
                        <Tooltip key={opt.slug} delayDuration={300}>
                          <TooltipTrigger asChild>
                            <div className="px-1">{content}</div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="max-w-[220px] text-xs"
                          >
                            {opt.description}
                          </TooltipContent>
                        </Tooltip>
                      );
                    }
                    return (
                      <div key={opt.slug} className="px-1">
                        {content}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}
