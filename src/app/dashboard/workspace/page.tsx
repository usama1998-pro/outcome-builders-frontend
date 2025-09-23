"use client"; // 👈 add this at the very top

// import styles from "./page.module.css";
// import RequireAuth from "../../components/auth/requireAuth";
// import { useSignOut } from "../../hooks/useAuth";

export default function DashboardWorkspace() {
    // const signOut = useSignOut();

    return (
        // <RequireAuth>
        <div className="">
            <h1>Outcome Builder Dashboard WorkSpace</h1>
            <p>Welcome to the Outcome Builder application!</p>
            <p>This is the home page.</p>
            <button onClick={() => console.log("Click")}>Sign Out!</button>
        </div>
        // </RequireAuth>

    );
}