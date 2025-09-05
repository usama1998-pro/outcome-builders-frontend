"use client";

import styles from "./page.module.css";
import { useSignin } from "../../hooks/useSignin";
import { useState } from "react";

export default function LoginForm() {
    const login = useSignin();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                login.mutate({ email, password });
            }}
            className="flex flex-col gap-4 p-6"
        >
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="border p-2"
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="border p-2"
            />
            <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded"
            >
                {login.isPending ? "Logging in..." : "Login"}
            </button>
        </form>
    );
}
