import SidePanel from "@/src/components/SidePanel/SidePanel";
import DashboardChatSplitPanel from "@/src/components/chat/DashboardChatSplitPanel";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

// import styles from "./page.module.css";
// import RequireAuth from "../components/auth/requireAuth";


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <div className="flex flex-row w-screen h-screen min-h-0 overflow-hidden p-0 m-0">
                {/* Sidebar */}
                <SidePanel />

                {/* Main content area — flex-1 shrinks when chat panel is open */}
                <div className="flex flex-col flex-1 relative z-10 min-w-0 min-h-0">
                    {/* Trigger pinned at the top */}
                    <SidebarTrigger className="sticky top-0 self-start z-[60]" />

                    <main className="m-0 p-0 relative z-10 min-w-0 min-h-0 flex flex-1 flex-col overflow-hidden">
                        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
                    </main>
                </div>

                {/* Chat: flex sibling (pushes main), not a fixed overlay */}
                <DashboardChatSplitPanel />
            </div>
        </SidebarProvider>
    );
}
