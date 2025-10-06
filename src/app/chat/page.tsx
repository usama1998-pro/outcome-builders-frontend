"use client";

// import { useSignOut } from "../../hooks/useAuth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Building, FolderPlus, MessageCircle, PlusCircle, Send, Share2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import BlurText from "../../../components/BlurText";
import Link from "next/link";

export default function Chat() {
    // const signOut = useSignOut();

    const handleAnimationComplete = () => {
        console.log('Animation completed!');
    };

    return (
        <div className="flex flex-col justify-center items-center h-screen w-full">
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">

            </div>


            <BlurText
                text="Whats on your mind today!"
                delay={150}
                animateBy="words"
                direction="top"
                onAnimationComplete={handleAnimationComplete}
                className="text-3xl mb-1"
            />

            {/* Chat Input */}
            <div className="p-4 w-[60%]">
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
            <div className="flex flex-row gap-4 justify-center w-full">

                <Link
                    href="/chat"
                    className={buttonVariants({ variant: "outline" })}
                >
                    <Building className="h-4 w-4" />

                    Create Organization
                </Link>

                <Link
                    href="/notes/create"
                    className={buttonVariants({ variant: "outline" })}
                >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Create Workspace
                </Link>

                <Link
                    href="/workspaces/create"
                    className={buttonVariants({ variant: "outline" })}
                >
                    <FolderPlus className="w-4 h-4 mr-2" />
                    Join Workspace
                </Link>

                <Link
                    href="/share"
                    className={buttonVariants({ variant: "outline" })}
                >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                </Link>
            </div>
        </div>
    );
}