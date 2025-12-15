"use client"; // 👈 add this at the very top

import styles from "./page.module.css";
import RequireAuth from "../../components/auth/requireAuth";
import { useSignOut } from "../../hooks/useAuth";
// import Navbar from "@/src/components/Navbar/Navbar";

export default function Dashboard() {
    const signOut = useSignOut();

    return (
        <RequireAuth>
            <>
                {/* <Navbar /> */}
                <div className={styles.page}>
                    <h1>Outcome Builder Dashboard</h1>
                    <p>Welcome to the Outcome Builder application!</p>
                    <p>This is the home page.</p>
                    <button onClick={signOut}>Sign Out!</button>
                </div>

            </>
        </RequireAuth>

    );
}
