
import SidePanel from "@/src/components/SidePanel/SidePanel";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

// import styles from "./page.module.css";
// import RequireAuth from "../components/auth/requireAuth";


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <div className="flex flex-row w-screen h-screen p-0 m-0">
                {/* Sidebar */}
                <SidePanel />

                {/* Main content area */}
                <div className="flex flex-col flex-1 relative z-10">
                    {/* Trigger pinned at the top */}
                    <SidebarTrigger className="sticky top-0 self-start z-[60]" />

                    <main className="m-0 p-0 relative z-10">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
