"use client"; // 👈 add this at the very top

// import styles from "./page.module.css";
// import RequireAuth from "../../components/auth/requireAuth";
// import { useSignOut } from "../../hooks/useAuth";

export default function DashboardHome() {
    // const signOut = useSignOut();

    return (
        // <RequireAuth>
        <div className="flex flex-col w-full h-full items-center justify-center border border-border p-5">
            <h1>Outcome Builder Dashboard Home</h1>
            <p>Welcome to the Outcome Builder application!</p>
            <p>This is the home page.</p>
            <button onClick={() => console.log("Click")}>Sign Out!</button>
        </div>
        // </RequireAuth>

    );
}