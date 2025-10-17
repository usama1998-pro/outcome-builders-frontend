"use client";

import React from "react";
import styles from "./BlockLoader.module.css";

export default function BlocksLoader() {
    return (
        <div className="flex items-center justify-center min-h-[100px]">
            <div className={`relative w-12 h-12 ${styles.spinSmooth}`}>
                <div className="absolute w-4 h-4 rounded-full bg-primary top-0 left-0" />
                <div className="absolute w-4 h-4 rounded-full bg-secondary top-0 right-0" />
                <div className="absolute w-4 h-4 rounded-full bg-accent bottom-0 left-0" />
                <div className="absolute w-4 h-4 rounded-full bg-primary bottom-0 right-0" />
            </div>
        </div>
    );
}
