"use client";

import { useSignOut } from "../../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

export default function Chat() {
    const signOut = useSignOut();

    return (
        <div className="flex flex-col h-screen w-full">
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
                <h1 className="text-xl font-bold">Chat</h1>
                <Button variant="ghost" onClick={signOut}>Sign Out</Button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Example Messages */}
                <div className="flex justify-start">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-2xl px-4 py-2 border max-w-xs"
                    >
                        Hello! How can I help you today?
                    </motion.div>
                </div>

                <div className="flex justify-end">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-2xl px-4 py-2 border max-w-xs"
                    >
                        I want to build a ChatGPT-like interface.
                    </motion.div>
                </div>
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t">
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