"use client";

import { Button } from "@/components/ui/button";
import { Send, Bot, User, Sparkles, Copy, Check, Square, Loader2, Brain, MessageSquare, ChevronDown, Star, RefreshCw, X, FileText, Plus } from "lucide-react";
import BlocksLoader from "@/src/components/Loaders/BlocksLoader/BlocksLoader";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChatMessage, ChatTab } from "../../../types/chat";
import { useRef, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { streamChat, getChatHistory, getChatTabs } from "../../../api/chat";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../../store/useAuth";
import ChatLandingPage from "../page";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

interface MessageBubbleProps {
    message: ChatMessage;
    index: number;
    isStreaming?: boolean;
    onAddContext?: (text: string) => void;
}

// Context separator for parsing stored questions
const CONTEXT_SEPARATOR = '\n\n---CONTEXT---\n\n';

function MessageBubble({ message, index, isStreaming = false, onAddContext }: MessageBubbleProps) {
    // User message has question, bot message has answer
    const isUser = !!message.question && !message.answer;
    const [copied, setCopied] = useState(false);
    const [selectedText, setSelectedText] = useState<string>("");
    const [showContextPopup, setShowContextPopup] = useState(false);
    const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
    const messageRef = useRef<HTMLDivElement>(null);
    const popupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleCopy = async () => {
        // For user messages, copy the original stored question (which includes context separator)
        // For bot messages, copy the answer
        let textToCopy = message.answer || message.question || "";
        
        // If it's a user message with context, format it nicely for copying
        if (isUser && contextText) {
            textToCopy = `Context: ${contextText}\n\nQuestion: ${displayQuestion}`;
        }
        
        try {
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    };

    // Handle text selection for bot messages
    useEffect(() => {
        if (isUser) return;

        const handleMouseUp = (e: MouseEvent) => {
            // Don't process if clicking on the popup button
            const target = e.target as HTMLElement;
            if (target.closest('[data-context-popup]')) {
                return;
            }

            // Check if ref is available - if not, skip this event
            // The effect will re-run when message changes and ref will be available
            if (!messageRef.current) {
                return;
            }

            // Clear any existing timeout
            if (popupTimeoutRef.current) {
                clearTimeout(popupTimeoutRef.current);
            }

            // Small delay to ensure selection is complete
            setTimeout(() => {
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0) {
                    // Delay hiding popup to allow clicking the button
                    popupTimeoutRef.current = setTimeout(() => {
                        setShowContextPopup(false);
                    }, 150);
                    return;
                }

                const selectedText = selection.toString().trim();
                if (selectedText.length === 0) {
                    popupTimeoutRef.current = setTimeout(() => {
                        setShowContextPopup(false);
                    }, 150);
                    return;
                }

                // Check if selection is within this message - improved for multi-line
                const range = selection.getRangeAt(0);
                const messageElement = messageRef.current;
                
                if (!messageElement) {
                    setShowContextPopup(false);
                    return;
                }

                // More robust check: verify selection intersects with message element
                // This works better for ReactMarkdown's nested structure
                const messageRect = messageElement.getBoundingClientRect();
                const selectionRect = range.getBoundingClientRect();
                
                // Check if selection rectangle overlaps with message rectangle
                const rectsOverlap = !(
                    selectionRect.right < messageRect.left ||
                    selectionRect.left > messageRect.right ||
                    selectionRect.bottom < messageRect.top ||
                    selectionRect.top > messageRect.bottom
                );
                
                // Also check if common ancestor is within message (for nested structures)
                const commonAncestor = range.commonAncestorContainer;
                const isAncestorInMessage = messageElement.contains(commonAncestor) || 
                    commonAncestor === messageElement ||
                    (commonAncestor.nodeType === Node.TEXT_NODE && messageElement.contains(commonAncestor.parentElement || commonAncestor));
                
                const isSelectionInMessage = rectsOverlap && isAncestorInMessage;

                if (isSelectionInMessage && selectedText.length > 0) {
                    setSelectedText(selectedText);
                    // Position popup near selection - use getBoundingClientRect for multi-line support
                    const rect = range.getBoundingClientRect();
                    setPopupPosition({
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10
                    });
                    setShowContextPopup(true);
                } else {
                    setShowContextPopup(false);
                }
            }, 10);
        };

        // Also handle clicks outside to close popup
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Don't close if clicking on popup or button
            if (target.closest('[data-context-popup]')) {
                return;
            }
            // Close popup if clicking outside
            if (showContextPopup) {
                setShowContextPopup(false);
                setSelectedText("");
            }
        };

        // Attach listeners - they will check ref availability inside handlers
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('click', handleClickOutside);
            if (popupTimeoutRef.current) {
                clearTimeout(popupTimeoutRef.current);
            }
        };
    }, [isUser, showContextPopup, message.id, message.answer]); // Re-run when message changes

    // For bot messages, show answer even if empty (for streaming)
    // For user messages, parse context and question separately
    let displayContent = isUser ? (message.question || "") : (message.answer !== null && message.answer !== undefined ? message.answer : "");
    let contextText: string | null = null;
    let displayQuestion = displayContent;
    
    // Parse context from stored question if present
    // Handle both formats:
    // 1. Messages with CONTEXT_SEPARATOR (from frontend state)
    // 2. Messages with \n\n separator (from database - concatenated format)
    if (isUser && displayContent) {
        // First, try parsing with CONTEXT_SEPARATOR (for messages in frontend state)
        if (displayContent.includes(CONTEXT_SEPARATOR)) {
            const parts = displayContent.split(CONTEXT_SEPARATOR);
            if (parts.length === 2) {
                contextText = parts[0].trim();
                displayQuestion = parts[1].trim();
            }
        } 
        // Otherwise, try parsing with \n\n separator (for messages from database)
        // Only parse if it looks like context (first part is substantial, > 30 chars)
        // and the question part is reasonable (not too short, > 5 chars)
        else if (displayContent.includes('\n\n')) {
            const parts = displayContent.split('\n\n');
            if (parts.length >= 2) {
                const potentialContext = parts[0].trim();
                const potentialQuestion = parts.slice(1).join('\n\n').trim();
                
                // Heuristic: If first part is substantial (> 30 chars) and question exists and is reasonable (> 5 chars),
                // treat first part as context. This handles the case where context was concatenated.
                if (potentialContext.length > 30 && potentialQuestion.length > 5) {
                    contextText = potentialContext;
                    displayQuestion = potentialQuestion;
                }
            }
        }
    }
    
    const timestamp = message.updated_at || message.created_at;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                duration: 0.3,
                delay: index * 0.05,
                type: "spring",
                stiffness: 200
            }}
            className={`flex flex-col gap-2 group ${isUser ? "items-end" : "items-start"}`}
        >
            <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
                {/* Bot Avatar with Sparkles */}
                {!isUser && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
                        <Sparkles className="w-4 h-4 text-white drop-shadow-sm" />
                    </div>
                )}

                {/* Message Content */}
                <div
                    className={`relative max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl rounded-2xl px-4 py-3 ${isUser
                        ? "bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 dark:from-violet-500 dark:via-purple-500 dark:to-indigo-500 shadow-lg shadow-violet-500/20"
                        : "bg-card border shadow-sm"
                        }`}
                >
                    {/* Subtle shine effect for user messages */}
                    {isUser && (
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-50" />
                    )}

                    {!isUser && isStreaming && (!displayContent || displayContent === "") ? (
                        <div className="relative z-10 py-2">
                            <div className="flex gap-1.5">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="w-2 h-2 bg-violet-500 rounded-full"
                                        animate={{ y: [0, -5, 0] }}
                                        transition={{
                                            duration: 0.6,
                                            repeat: Infinity,
                                            delay: i * 0.15
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className={`relative z-10 text-sm sm:text-base leading-relaxed ${isUser ? "!text-white" : "text-foreground"}`}>
                            {isUser ? (
                                <div className="space-y-2">
                                    {contextText ? (
                                        <>
                                            <blockquote className="border-l-3 border-white/40 pl-3 italic text-white/90 text-sm bg-white/10 rounded-r py-2 mb-2">
                                                <span className="text-xs font-semibold text-white/70 mb-1 block uppercase tracking-wide">Context</span>
                                                {contextText}
                                            </blockquote>
                                            <p className="mt-1">{displayQuestion}</p>
                                        </>
                                    ) : (
                                        <p>{displayQuestion}</p>
                                    )}
                                </div>
                            ) : (
                                <div 
                                    ref={messageRef}
                                    className={`markdown-content ${isStreaming ? 'streaming-cursor' : ''} select-text`}
                                    onMouseUp={(e) => {
                                        // Allow selection to complete before checking
                                        e.stopPropagation();
                                    }}
                                >
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeHighlight]}
                                        components={{
                                            // Customize code blocks
                                            code({ node, inline, className, children, ...props }: any) {
                                                const match = /language-(\w+)/.exec(className || '');
                                                return !inline && match ? (
                                                    <pre className="bg-muted rounded-lg p-4 overflow-x-auto border border-border">
                                                        <code className={className} {...props}>
                                                            {children}
                                                        </code>
                                                    </pre>
                                                ) : (
                                                    <code className="bg-muted/50 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                                                        {children}
                                                    </code>
                                                );
                                            },
                                            // Customize paragraphs
                                            p({ children }: any) {
                                                return <p className="mb-2 last:mb-0">{children}</p>;
                                            },
                                            // Customize lists
                                            ul({ children }: any) {
                                                return <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>;
                                            },
                                            ol({ children }: any) {
                                                return <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>;
                                            },
                                            // Customize headings
                                            h1({ children }: any) {
                                                return <h1 className="text-xl font-bold mb-2 mt-4 first:mt-0">{children}</h1>;
                                            },
                                            h2({ children }: any) {
                                                return <h2 className="text-lg font-semibold mb-2 mt-3 first:mt-0">{children}</h2>;
                                            },
                                            h3({ children }: any) {
                                                return <h3 className="text-base font-semibold mb-1 mt-2 first:mt-0">{children}</h3>;
                                            },
                                            // Customize links
                                            a({ children, href }: any) {
                                                return (
                                                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-violet-600 dark:text-violet-400 hover:underline">
                                                        {children}
                                                    </a>
                                                );
                                            },
                                            // Customize blockquotes
                                            blockquote({ children }: any) {
                                                return (
                                                    <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic my-2">
                                                        {children}
                                                    </blockquote>
                                                );
                                            },
                                        }}
                                    >
                                        {displayContent}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Timestamp */}
                    {timestamp && (
                        <p className={`text-[10px] mt-1.5 ${isUser ? "!text-white/80" : "text-muted-foreground"}`}>
                            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    )}
                </div>

                {/* User Avatar */}
                {isUser && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg">
                        <User className="w-4 h-4 text-white" />
                    </div>
                )}
            </div>

            {/* Copy button for bot messages - appears below bubble on hover */}
            {!isUser && displayContent && (
                <div className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isUser ? "mr-11" : "ml-11"}`}>
                    <Button
                        onClick={handleCopy}
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        title={copied ? "Copied!" : "Copy message"}
                    >
                        {copied ? (
                            <>
                                <Check className="h-3 w-3 mr-1 text-emerald-500" />
                                Copied
                            </>
                        ) : (
                            <>
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                            </>
                        )}
                    </Button>
                </div>
            )}

            {/* Context popup for selected text */}
            {!isUser && showContextPopup && selectedText && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    data-context-popup
                    className="fixed z-50 bg-card border rounded-lg shadow-lg p-1.5"
                    style={{
                        left: `${popupPosition.x}px`,
                        top: `${popupPosition.y}px`,
                        transform: 'translate(-50%, -100%)',
                        marginTop: '-8px'
                    }}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    <Button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (onAddContext && selectedText) {
                                onAddContext(selectedText);
                            }
                            // Clear selection and close popup
                            window.getSelection()?.removeAllRanges();
                            setShowContextPopup(false);
                            setSelectedText("");
                        }}
                        size="sm"
                        variant="default"
                        className="h-7 px-2.5 text-xs bg-violet-600 hover:bg-violet-700 text-white"
                    >
                        <Plus className="h-3 w-3 mr-1.5" />
                        Add as Context
                    </Button>
                </motion.div>
            )}
        </motion.div>
    );
}

function TypingIndicator() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex gap-3 justify-start"
        >
            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
                <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-card border rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-2 h-2 bg-violet-500 rounded-full"
                            animate={{ y: [0, -5, 0] }}
                            transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: i * 0.15
                            }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

export default function Chat() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const chatId = params.chatId as string;
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingMessageId, setStreamingMessageId] = useState<number | null>(null);
    const streamingMessageIdRef = useRef<number | null>(null);
    const [currentChatTabId, setCurrentChatTabId] = useState<number | null>(null);
    const [agentMode, setAgentMode] = useState(false);
    const [currentStatus, setCurrentStatus] = useState<string | null>(null);
    const [selectedContext, setSelectedContext] = useState<{ 
        type: 'text' | null; 
        id: number | null; 
        name: string | null;
        text?: string | null;
    }>({ type: null, id: null, name: null, text: null });

    const handleAddTextContext = (text: string) => {
        // Truncate long text (max 200 characters for display)
        const maxLength = 200;
        const displayName = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
        
        setSelectedContext({
            type: 'text',
            id: null,
            name: displayName,
            text: text // Store full text for API
        });
        // Clear selection
        window.getSelection()?.removeAllRanges();
    };
    const lastLoadedChatIdRef = useRef<string | null>(null);
    const isCreatingNewChatRef = useRef<boolean>(false);
    const lastChatHistoryMessageCountRef = useRef<number>(-1);

    // Load chat tabs to check if we should show landing page
    const currentTenantId = useAuthStore((s) => s.tenantId);
    const { data: chatTabs = [], isLoading: isLoadingChatTabs } = useQuery({
        queryKey: ["chatTabs", currentTenantId],
        queryFn: getChatTabs,
        enabled: !!currentTenantId,
        staleTime: 1000 * 30, // Consider data fresh for 30 seconds
        refetchOnWindowFocus: false, // Don't refetch when window regains focus
    });


    // Track if we're transitioning from "new" to a chat ID (new chat creation)
    useEffect(() => {
        // Don't update flags if we're currently streaming (onStart already set them)
        if (isStreaming) {
            return;
        }

        if (chatId === "new") {
            isCreatingNewChatRef.current = true;
            lastChatHistoryMessageCountRef.current = -1; // Reset when going to "new"
        } else if (chatId !== "new" && lastLoadedChatIdRef.current === "new") {
            // We just transitioned from "new" to a chat ID - this is a new chat creation
            isCreatingNewChatRef.current = true;
            lastChatHistoryMessageCountRef.current = -1; // Reset for new chat
        } else if (chatId !== "new" && lastLoadedChatIdRef.current !== "new" && lastLoadedChatIdRef.current !== chatId) {
            // We're switching from one chat ID to another - this is selecting an existing chat
            isCreatingNewChatRef.current = false;
            lastChatHistoryMessageCountRef.current = -1; // Reset when switching chats
        }
    }, [chatId, isStreaming]);

    // Load chat history - only when selecting an existing chat tab, not when creating a new chat
    // Only enable if chatId is valid, not "new", tenant exists, and we're not creating a new chat
    const shouldLoadHistory = !!(chatId && chatId !== "new" && currentTenantId && !isCreatingNewChatRef.current);
    const { data: chatHistory, isLoading: isLoadingHistory, isFetching: isFetchingHistory, refetch: refetchHistory } = useQuery({
        queryKey: ["chatHistory", chatId, currentTenantId],
        queryFn: async () => {
            if (chatId && chatId !== "new" && currentTenantId) {
                try {
                    const history = await getChatHistory(parseInt(chatId));
                    // Handle case where chat tab doesn't exist (returns empty list)
                    if (history.chat_tab) {
                        setCurrentChatTabId(history.chat_tab.id);
                    } else {
                        // Chat tab doesn't exist, return empty history
                        return {
                            chat_tab: null,
                            messages: []
                        };
                    }
                    return history;
                } catch (error: any) {
                    console.error("Error loading chat history:", error);
                    // Log the full error for debugging
                    if (error.response?.data) {
                        console.error("Error response data:", error.response.data);
                    }
                    // Don't show error toast for 404/422 - just return empty
                    if (error.response?.status === 404 || error.response?.status === 422) {
                        return {
                            chat_tab: null,
                            messages: []
                        };
                    }
                    toast.error(`Failed to load chat history: ${error.message || "Unknown error"}`);
                    return {
                        chat_tab: null,
                        messages: []
                    };
                }
            }
            return null;
        },
        enabled: shouldLoadHistory,
        retry: false, // Don't retry on 404/422 errors
        refetchOnWindowFocus: false, // Don't refetch when window regains focus
        refetchOnMount: false, // Don't refetch on mount - only load when chatId changes
        staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    });

    // Check for pending question from landing page and auto-send
    useEffect(() => {
        if (chatId === "new") {
            const pendingQuestion = sessionStorage.getItem("pendingChatQuestion");
            const pendingAgentMode = sessionStorage.getItem("pendingChatAgentMode");

            if (pendingQuestion && !isStreaming) {
                // Clear the pending question immediately
                sessionStorage.removeItem("pendingChatQuestion");
                sessionStorage.removeItem("pendingChatAgentMode");

                // Set agent mode if it was set
                if (pendingAgentMode === "true") {
                    setAgentMode(true);
                }

                // Auto-send the message
                const originalQuestion = pendingQuestion.trim();
                if (originalQuestion) {
                    // Prepare question for backend (with context concatenated)
                    // Store context before clearing to ensure it's included in the query
                    const contextToSend = selectedContext.type === 'text' && selectedContext.text 
                        ? selectedContext.text 
                        : null;
                    
                    let questionForBackend = originalQuestion;
                    if (contextToSend) {
                        questionForBackend = `${contextToSend}\n\n${originalQuestion}`;
                    }

                    // Store question with context separator for display parsing
                    const storedQuestion = contextToSend
                        ? `${contextToSend}${CONTEXT_SEPARATOR}${originalQuestion}`
                        : originalQuestion;

                    // Add user message immediately
                    const userMessage: ChatMessage = {
                        id: Date.now(),
                        chat_tab_id: 0,
                        question: storedQuestion, // Store with separator for parsing
                        answer: null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    };

                    // Create bot message placeholder immediately for smooth UX
                    const botMessage: ChatMessage = {
                        id: Date.now() + 1,
                        chat_tab_id: 0,
                        question: "",
                        answer: "",
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    };

                    setMessages([userMessage, botMessage]);
                    setStreamingMessageId(botMessage.id);
                    streamingMessageIdRef.current = botMessage.id;

                    // Clear context immediately after message is sent
                    setSelectedContext({ type: null, id: null, name: null, text: null });

                    // Start streaming
                    setIsStreaming(true);

                    // Create abort controller for this stream
                    const abortController = new AbortController();
                    abortControllerRef.current = abortController;

                    try {
                        const controller = streamChat(
                            questionForBackend, // Send concatenated version to backend
                            undefined, // No chat_tab_id - will create new one
                            pendingAgentMode === "true",
                            undefined, // Don't send context separately since it's in the question
                            {
                                onStart: (messageId, chatTabId, streamId) => {
                                    setCurrentStatus(null);
                                    // Update with real IDs
                                    setCurrentChatTabId(chatTabId);
                                    setStreamingMessageId(messageId);
                                    streamingMessageIdRef.current = messageId;

                                    // Update bot message with real ID
                                    setMessages((prev) => {
                                        const updated = [...prev];
                                        const lastMsg = updated[updated.length - 1];
                                        if (lastMsg && !lastMsg.answer) {
                                            return [...updated.slice(0, -1), {
                                                ...lastMsg,
                                                id: messageId,
                                                chat_tab_id: chatTabId,
                                            }];
                                        }
                                        return updated;
                                    });

                                    // Update URL without reload (only if we're still on /chat/new)
                                    if (chatId === "new") {
                                        // Mark that we're creating a new chat BEFORE updating URL
                                        // This prevents history from loading when chatId changes
                                        isCreatingNewChatRef.current = true;
                                        lastLoadedChatIdRef.current = "new";
                                        // Use window.history to update URL without reload
                                        window.history.replaceState(null, "", `/chat/${chatTabId}`);
                                    }
                                },
                                onChunk: (content) => {
                                    setMessages((prev) => {
                                        const currentStreamingId = streamingMessageIdRef.current;
                                        if (!currentStreamingId) return prev;

                                        // Find the message with the streaming ID
                                        const messageIndex = prev.findIndex(msg => msg.id === currentStreamingId);
                                        if (messageIndex === -1) return prev;

                                        const updated = [...prev];
                                        const streamingMsg = updated[messageIndex];
                                        updated[messageIndex] = {
                                            ...streamingMsg,
                                            answer: (streamingMsg.answer || "") + content,
                                        };
                                        return updated;
                                    });
                                },
                                onStatus: (status, step) => {
                                    if (pendingAgentMode === "true") {
                                        setCurrentStatus(status);
                                    }
                                },
                                onComplete: () => {
                                    setIsStreaming(false);
                                    setStreamingMessageId(null);
                                    setCurrentStatus(null);
                                    abortControllerRef.current = null;
                                    // Invalidate chat tabs after completion to update the list (e.g., new chat created)
                                    queryClient.invalidateQueries({ queryKey: ["chatTabs"] });
                                },
                                onStop: async () => {
                                    setIsStreaming(false);
                                    setStreamingMessageId(null);
                                    setCurrentStatus(null);
                                    abortControllerRef.current = null;
                                    toast.info("Response stopped. Partial response saved.");
                                    // Wait for backend to save, then refetch to get the saved partial response
                                    setTimeout(async () => {
                                        if (chatId && chatId !== "new") {
                                            try {
                                                await refetchHistory();
                                            } catch (error) {
                                                console.error("Error refetching history after stop:", error);
                                            }
                                        }
                                    }, 1000); // Increased delay to ensure backend has time to save
                                },
                                onError: (error) => {
                                    setIsStreaming(false);
                                    setStreamingMessageId(null);
                                    setCurrentStatus(null);
                                    abortControllerRef.current = null;
                                    // Clear context even on error (message was attempted to be sent)
                                    setSelectedContext({ type: null, id: null, name: null, text: null });
                                    toast.error(`Error: ${error}`);
                                },
                            }
                        );

                        abortControllerRef.current = controller;
                    } catch (error: any) {
                        setIsStreaming(false);
                        setStreamingMessageId(null);
                        // Clear context even on error (message was attempted to be sent)
                        setSelectedContext({ type: null, id: null, name: null, text: null });
                        toast.error(`Failed to send message: ${error.message}`);
                    }
                }
            }
        }
    }, [chatId, isStreaming, router, queryClient, refetchHistory]);

    // Update messages when history loads (only on initial load or when chatId changes)
    useEffect(() => {
        // Check if this is a new chat (chatId changed)
        const isNewChat = lastLoadedChatIdRef.current !== chatId;

        if (chatHistory && typeof chatHistory === 'object' && 'messages' in chatHistory) {
            const currentMessageCount = chatHistory.messages?.length || 0;
            const previousMessageCount = lastChatHistoryMessageCountRef.current;
            
            // If chatHistory exists but has no messages (cleared chat), clear local messages
            if (currentMessageCount === 0) {
                // Only clear messages if:
                // 1. We're viewing this chat and not streaming
                // 2. This is a transition from having messages to having no messages (cleared)
                //    OR it's a new chat load with no messages
                // Don't clear if we previously had 0 messages and still have 0 (to avoid clearing newly added local messages)
                if (chatId !== "new" && !isStreaming) {
                    // Clear if: transitioning from messages to empty, OR it's a new chat with no messages
                    if (previousMessageCount > 0 || isNewChat) {
                        setMessages([]);
                        lastLoadedChatIdRef.current = chatId;
                    }
                    lastChatHistoryMessageCountRef.current = 0;
                } else {
                    lastChatHistoryMessageCountRef.current = 0;
                }
                return;
            }
            
            // Update the message count reference
            lastChatHistoryMessageCountRef.current = currentMessageCount;

            // Only load/replace history if:
            // 1. We haven't loaded this chat yet (isNewChat)
            // 2. We're not currently streaming (to avoid overwriting streaming messages)
            // 3. We're not creating a new chat (coming from "new")
            if (isNewChat && !isStreaming && chatHistory.messages && !isCreatingNewChatRef.current) {
                const formattedMessages: ChatMessage[] = [];
                chatHistory.messages.forEach((msg: ChatMessage) => {
                    // Add user message (question)
                    if (msg.question) {
                        formattedMessages.push({
                            ...msg,
                            answer: null, // Clear answer for user message display
                        });
                    }
                    // Add bot response (answer) if exists
                    if (msg.answer) {
                        formattedMessages.push({
                            ...msg,
                            question: "", // Clear question for bot message display
                        });
                    }
                });
                setMessages(formattedMessages);
                lastLoadedChatIdRef.current = chatId;
                lastChatHistoryMessageCountRef.current = chatHistory.messages.length;
                // Reset the flag after loading history
                isCreatingNewChatRef.current = false;

                // Update currentChatTabId if available
                if (chatHistory.chat_tab) {
                    setCurrentChatTabId(chatHistory.chat_tab.id);
                }
            } else if (isCreatingNewChatRef.current && chatId !== "new") {
                // If we just created a new chat, reset the flag after a moment
                // This allows the next navigation to load history normally
                setTimeout(() => {
                    isCreatingNewChatRef.current = false;
                    lastLoadedChatIdRef.current = chatId;
                }, 100);
            }
        }
    }, [chatHistory, chatId, isStreaming]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Scroll once when streaming starts
    useEffect(() => {
        if (isStreaming) {
            // Small delay to ensure DOM is updated
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        }
    }, [isStreaming]);

    const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!inputValue.trim() || isStreaming) {
            return;
        }

        const originalQuestion = inputValue.trim();
        setInputValue("");

        // Prepare question for backend (with context concatenated)
        // Store context before clearing to ensure it's included in the query
        const contextToSend = selectedContext.type === 'text' && selectedContext.text 
            ? selectedContext.text 
            : null;
        
        let questionForBackend = originalQuestion;
        if (contextToSend) {
            questionForBackend = `${contextToSend}\n\n${originalQuestion}`;
        }

        // Store question with context separator for display parsing
        const storedQuestion = contextToSend
            ? `${contextToSend}${CONTEXT_SEPARATOR}${originalQuestion}`
            : originalQuestion;

        // Add user message immediately
        const userMessage: ChatMessage = {
            id: Date.now(), // Temporary ID
            chat_tab_id: currentChatTabId || 0,
            question: storedQuestion, // Store with separator for parsing
            answer: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        // Create bot message placeholder immediately for smooth UX
        const botMessage: ChatMessage = {
            id: Date.now() + 1,
            chat_tab_id: currentChatTabId || 0,
            question: "",
            answer: "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage, botMessage]);
        setStreamingMessageId(botMessage.id);
        streamingMessageIdRef.current = botMessage.id;

        // Clear context immediately after message is sent
        setSelectedContext({ type: null, id: null, name: null, text: null });

        // Start streaming
        setIsStreaming(true);

        // Create abort controller for this stream
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
            const controller = streamChat(
                questionForBackend, // Send concatenated version to backend
                currentChatTabId || undefined,
                agentMode,
                undefined, // Don't send context separately since it's in the question
                {
                    onStart: (messageId, chatTabId, streamId) => {
                        setCurrentStatus(null);
                        // Update with real IDs
                        setCurrentChatTabId(chatTabId);
                        setStreamingMessageId(messageId);
                        streamingMessageIdRef.current = messageId;

                        // Update bot message with real ID
                        setMessages((prev) => {
                            const updated = [...prev];
                            const lastMsg = updated[updated.length - 1];
                            if (lastMsg && !lastMsg.answer) {
                                return [...updated.slice(0, -1), {
                                    ...lastMsg,
                                    id: messageId,
                                    chat_tab_id: chatTabId,
                                }];
                            }
                            return updated;
                        });

                        // Update URL without reload (only if we're still on /chat/new)
                        if (chatId === "new") {
                            // Mark that we're creating a new chat BEFORE updating URL
                            // This prevents history from loading when chatId changes
                            isCreatingNewChatRef.current = true;
                            lastLoadedChatIdRef.current = "new";
                            // Use window.history to update URL without reload
                            window.history.replaceState(null, "", `/chat/${chatTabId}`);
                        }
                    },
                    onChunk: (content) => {
                        setMessages((prev) => {
                            const currentStreamingId = streamingMessageIdRef.current;
                            if (!currentStreamingId) return prev;

                            // Find the message with the streaming ID
                            const messageIndex = prev.findIndex(msg => msg.id === currentStreamingId);
                            if (messageIndex === -1) return prev;

                            const updated = [...prev];
                            const streamingMsg = updated[messageIndex];
                            updated[messageIndex] = {
                                ...streamingMsg,
                                answer: (streamingMsg.answer || "") + content,
                            };
                            return updated;
                        });
                    },
                    onStatus: (status, step) => {
                        if (agentMode) {
                            setCurrentStatus(status);
                        }
                    },
                    onComplete: () => {
                        setIsStreaming(false);
                        setStreamingMessageId(null);
                        setCurrentStatus(null);
                        abortControllerRef.current = null;
                        // Invalidate chat tabs after completion to update the list (e.g., new chat created)
                        queryClient.invalidateQueries({ queryKey: ["chatTabs"] });
                    },
                    onStop: async () => {
                        setIsStreaming(false);
                        setStreamingMessageId(null);
                        setCurrentStatus(null);
                        abortControllerRef.current = null;
                        toast.info("Response stopped. Partial response saved.");
                        // Wait for backend to save, then refetch to get the saved partial response
                        setTimeout(async () => {
                            if (chatId && chatId !== "new") {
                                try {
                                    await refetchHistory();
                                } catch (error) {
                                    console.error("Error refetching history after stop:", error);
                                }
                            }
                        }, 1000); // Increased delay to ensure backend has time to save
                    },
                    onError: (error) => {
                        setIsStreaming(false);
                        setStreamingMessageId(null);
                        setCurrentStatus(null);
                        abortControllerRef.current = null;
                        toast.error(`Error: ${error}`);
                    },
                }
            );

            abortControllerRef.current = controller;
        } catch (error: any) {
            setIsStreaming(false);
            setStreamingMessageId(null);
            // Clear context even on error (message was attempted to be sent)
            setSelectedContext({ type: null, id: null, name: null, text: null });
            toast.error(`Failed to send message: ${error.message}`);
        }
    };

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    };

    // Show landing page if there are no chat tabs AND no pending question AND no messages
    const pendingQuestion = typeof window !== "undefined" ? sessionStorage.getItem("pendingChatQuestion") : null;
    // If no chat tabs exist and we're not loading, always show landing page (unless streaming or pending)
    // BUT only show landing page if we're on "new" chat page, not on an existing chat
    const shouldShowLandingPage = chatId === "new" &&
        !isLoadingChatTabs &&
        chatTabs.length === 0 &&
        !pendingQuestion &&
        messages.length === 0 &&
        !isStreaming;

    // Show loading state when chat tabs are loading initially (only on "new" page)
    if (isLoadingChatTabs && chatId === "new" && messages.length === 0 && !pendingQuestion) {
        return (
            <div className="flex flex-col h-full w-full items-center justify-center">
                <BlocksLoader />
                <p className="text-sm text-muted-foreground mt-4">Loading chats...</p>
            </div>
        );
    }

    // Show loading state when on an existing chat and either tabs or history are loading
    if (chatId !== "new" && (isLoadingChatTabs || isLoadingHistory || isFetchingHistory) && messages.length === 0 && !isStreaming) {
        return (
            <div className="flex flex-col h-full w-full items-center justify-center">
                <BlocksLoader />
                <p className="text-sm text-muted-foreground mt-4">
                    {isLoadingChatTabs ? "Loading chats..." : "Loading chat history..."}
                </p>
            </div>
        );
    }

    // Show landing page when there are no chat tabs and no pending question (only on "new" page)
    if (shouldShowLandingPage) {
        return (
            <div className="flex flex-col h-full w-full">
                <ChatLandingPage />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full">
            {/* Chat Header - Status Message Only */}
            {(agentMode && currentStatus) && (
                <div className="flex-shrink-0 px-4 sm:px-6 py-3 border-b bg-background/80 backdrop-blur-sm">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-muted">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-500" />
                            <span className="text-xs text-muted-foreground">{currentStatus}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
                <div className="max-w-4xl mx-auto space-y-4">
                    {/* Loading State - This should rarely show now since we handle it above, but keep as fallback */}
                    {((isLoadingHistory || isFetchingHistory) || (chatId !== "new" && currentTenantId && !chatHistory && !isCreatingNewChatRef.current && !isLoadingChatTabs)) && chatId !== "new" && messages.length === 0 && !isStreaming && (
                        <div className="flex flex-col items-center justify-center py-12 min-h-[400px]">
                            <BlocksLoader />
                            <p className="text-sm text-muted-foreground mt-4">Loading chat history...</p>
                        </div>
                    )}
                    {/* Empty State - Only show when not loading tabs, not loading history, not fetching, and we have loaded history (or confirmed empty) */}
                    {!isLoadingChatTabs && !isLoadingHistory && !isFetchingHistory && chatHistory !== undefined && messages.length === 0 && !isStreaming && chatId !== "new" && (
                        <div className="w-full flex items-center justify-center py-12 min-h-[400px]">
                            <div className="flex flex-col items-center text-center max-w-lg">
                                <div className="relative mb-8">
                                    {/* Animated background gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
                                    {/* Main icon container */}
                                    <div className="relative w-32 h-32 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-indigo-500/10 dark:from-violet-900/30 dark:via-purple-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center border border-violet-500/20 dark:border-violet-500/30 shadow-lg">
                                        <MessageSquare className="w-16 h-16 text-violet-500 dark:text-violet-400" />
                                    </div>
                                    {/* Decorative sparkles */}
                                    <div className="absolute -top-2 -right-2">
                                        <Sparkles className="w-6 h-6 text-violet-400 animate-pulse" />
                                    </div>
                                    <div className="absolute -bottom-2 -left-2">
                                        <Sparkles className="w-5 h-5 text-purple-400 animate-pulse delay-300" />
                                    </div>
                                </div>
                                
                                <h3 className="text-2xl font-bold text-foreground mb-3">
                                    Start a Conversation
                                </h3>
                                
                                <p className="text-muted-foreground mb-8 text-base leading-relaxed">
                                    Ask questions, get insights from your trained articles, and explore your knowledge base. 
                                    Your AI assistant is ready to help!
                                </p>
                            </div>
                        </div>
                    )}
                    <AnimatePresence mode="popLayout">
                        {messages.map((msg, index) => (
                            <MessageBubble
                                key={`${msg.id}-${index}`}
                                message={msg}
                                index={index}
                                isStreaming={isStreaming && streamingMessageId === msg.id}
                                onAddContext={handleAddTextContext}
                            />
                        ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Chat Input */}
            <div className="flex-shrink-0 px-4 sm:px-6 py-4 sm:py-6 border-t bg-background/80 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto">
                    {/* Context Display - Above input (only shows when context is added) */}
                    {selectedContext.type === 'text' && selectedContext.name && (
                        <div className="mb-3 px-3 py-2 bg-muted/50 border rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium block truncate">{selectedContext.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        (Text context)
                                    </span>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedContext({ type: null, id: null, name: null, text: null })}
                                className="h-6 w-6 p-0 flex-shrink-0 ml-2"
                                disabled={isStreaming}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    )}

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSend(e);
                        }}
                        className="relative"
                        noValidate
                    >
                        {/* Input Container - like ChatGPT/Cursor */}
                        <div className="relative bg-card border rounded-2xl shadow-lg overflow-hidden">
                            {/* Input Row */}
                            <div className="flex items-center gap-2 p-1.5 sm:p-2">
                                <Input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Type your message..."
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            if (inputValue.trim() && !isStreaming) {
                                                const formEvent = new Event("submit", { bubbles: true, cancelable: true });
                                                handleSend(formEvent as any);
                                            }
                                        }
                                    }}
                                    disabled={isStreaming}
                                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-3"
                                />
                                {isStreaming ? (
                                    <Button
                                        type="button"
                                        onClick={handleStop}
                                        size="icon"
                                        variant="destructive"
                                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex-shrink-0"
                                    >
                                        <Square className="h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        size="icon"
                                        disabled={!inputValue.trim()}
                                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 dark:from-violet-500 dark:via-purple-500 dark:to-indigo-500 hover:opacity-90 transition-opacity shadow-md !text-white flex-shrink-0"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                )}
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
                                            disabled={isStreaming}
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

                                {/* Helper text */}
                                <p className="text-[10px] sm:text-xs text-muted-foreground/60">
                                    {isStreaming
                                        ? "Streaming response..."
                                        : "AI responses are based on your trained articles"}
                                </p>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
