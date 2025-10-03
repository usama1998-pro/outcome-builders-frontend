"use client";

// import { Button } from "@/components/ui/button";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import Navbar from "@/src/components/Navbar/Navbar";
import { MessageCircle, PlusCircle, FolderPlus, Share2 } from "lucide-react";
import BlurText from "../../components/BlurText";
// import styles from "./page.module.css";
// import RequireAuth from "../components/auth/requireAuth";


export default function LandingPage() {
  const handleAnimationComplete = () => {
    console.log('Animation completed!');
  };
  return (
    <>
      <Navbar />
      <div className="flex items-center justify-center flex-col p-10 w-full h-full gap-6">
        <p>Click on the following and lets get started!</p>
        <div className="flex flex-row gap-4 justify-center w-full">

          <Link
            href="/chat"
            className={buttonVariants({ variant: "outline" })}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat
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
        <BlurText
          text="Welcome to outcome builders!"
          delay={150}
          animateBy="words"
          direction="top"
          onAnimationComplete={handleAnimationComplete}
          className="text-6xl mt-5"
        />
      </div>
    </>
  );
}
