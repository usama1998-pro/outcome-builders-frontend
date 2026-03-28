"use client";

import RequireAuth from "@/src/components/auth/requireAuth";

export default function ChatWidgetPage() {
    return (
        <RequireAuth>
            <div className="w-full h-full flex flex-col p-6 gap-4">
                <div className="border-b border-border pb-4">
                    <h1 className="text-2xl font-semibold">Chat Widget</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Configure and manage your embedded chat widget for your site or app.
                    </p>
                </div>
                <p className="text-sm text-muted-foreground">
                    Widget settings will appear here.
                </p>
            </div>
        </RequireAuth>
    );
}
