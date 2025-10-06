"use client";

// import { useSignOut } from "../../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { ChatMessage } from "../../../types/chat";

export default function Chat() {

    const chatMessages: ChatMessage[] = [
        // Chat 1
        {
            id: "1",
            chatId: "chat-1",
            sender: "bot",
            content: "Hi, how’s the project going?",
            timestamp: "2025-10-03T17:00:00Z",
        },
        {
            id: "2",
            chatId: "chat-1",
            sender: "user",
            content: "Pretty good! We’re almost done.",
            timestamp: "2025-10-03T17:05:00Z",
        },
        {
            id: "3",
            chatId: "chat-1",
            sender: "bot",
            content: "Great! Can you send me a summary later?",
            timestamp: "2025-10-03T17:15:00Z",
        },
        {
            id: "4",
            chatId: "chat-1",
            sender: "user",
            content: "Sure, I’ll prepare the summary.",
            timestamp: "2025-10-03T18:25:00Z",
        },

        // Chat 2
        {
            id: "5",
            chatId: "chat-2",
            sender: "user",
            content: "Any ideas for our vacation?",
            timestamp: "2025-10-02T12:00:00Z",
        },
        {
            id: "6",
            chatId: "chat-2",
            sender: "bot",
            content: "What about Japan or Italy?",
            timestamp: "2025-10-02T12:10:00Z",
        },
        {
            id: "7",
            chatId: "chat-2",
            sender: "user",
            content: "Italy sounds perfect.",
            timestamp: "2025-10-02T13:00:00Z",
        },
        {
            id: "8",
            chatId: "chat-2",
            sender: "bot",
            content: "Let’s book the tickets tomorrow.",
            timestamp: "2025-10-02T14:10:00Z",
        },

        // Chat 3
        {
            id: "9",
            chatId: "chat-3",
            sender: "user",
            content: "What if we build an AI that generates songs?",
            timestamp: "2025-09-30T09:00:00Z",
        },
        {
            id: "10",
            chatId: "chat-3",
            sender: "bot",
            content: "That sounds like a fun experiment!",
            timestamp: "2025-09-30T09:45:00Z",
        },
        {
            id: "11",
            chatId: "chat-3",
            sender: "user",
            content: "That sounds like a fun experiment!",
            timestamp: "2025-09-30T09:45:00Z",
        },
    ];
    // const signOut = useSignOut();

    return (
        <div className="flex flex-col justify-center items-center h-screen w-full">
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">

            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-6 space-y-4 w-full flex flex-col overflow-y-auto">
                {/* Example Messages */}

                {chatMessages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.sender === "user" ? "justify-end mr-50" : "justify-start ml-50"}`}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`rounded-2xl px-4 py-2 border max-w-xs ${msg.sender === "user" ? "bg-muted text-foreground" : "bg-card text-card-foreground"
                                }`}
                        >
                            {msg.content}
                        </motion.div>
                    </div>
                ))}


            </div>

            {/* Chat Input */}
            <div className="p-4 pb-10 border-t w-[60%]">
                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-2 w-full"
                >
                    <Input
                        type="text"
                        placeholder="Type your message..."
                        className="flex-1"
                    />
                    <Button type="submit" size="icon">
                        <Send className="h-4 w-4" />
                    </Button>
                </motion.form>
            </div>
        </div>
    );
}
