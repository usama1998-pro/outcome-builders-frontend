// import Navbar from "@/src/components/Navbar/Navbar";
import SidePanel from "@/src/components/SidePanel/SidePanel";
// import styles from "./page.module.css";
// import RequireAuth from "../components/auth/requireAuth";


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <div className="w-full h-screen flex flex-row">
                <SidePanel />
                <div className="w-screen h-screen flex item-center justify-center flex-col p-10 overflow-y-scroll text-white">
                    <main>{children}</main>
                </div>
            </div>
        </>
    );
}
