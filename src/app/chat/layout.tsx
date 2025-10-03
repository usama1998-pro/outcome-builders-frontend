
import ChatSidePanel from "@/src/components/SidePanel/ChatSidePanel";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

// import styles from "./page.module.css";
// import RequireAuth from "../components/auth/requireAuth";


export default function ChatLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <div className="flex flex-row w-screen h-screen p-0 m-0">
                {/* Sidebar */}
                <ChatSidePanel />

                {/* Main content area */}
                <div className="flex flex-col flex-1">
                    {/* Trigger pinned at the top */}
                    <SidebarTrigger className="sticky top-0 self-start" />

                    <main className="m-0 p-0 flex-1 flex flex-col overflow-hidden">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
