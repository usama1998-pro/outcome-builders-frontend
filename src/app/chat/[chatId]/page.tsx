"use client";

import { useParams } from "next/navigation";
import ChatClient from "../ChatClient";

export default function ChatIdPage() {
    const params = useParams();
    const raw = params.chatId;
    const chatId = typeof raw === "string" ? raw : "new";
    return <ChatClient chatId={chatId} />;
}
