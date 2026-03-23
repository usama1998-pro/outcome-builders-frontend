"use client";

import RequireAuth from "@/src/components/auth/requireAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase } from "lucide-react";

export default function ClientsPage() {
    return (
        <RequireAuth>
            <div className="w-full h-full flex flex-col items-center p-6 gap-6">
                <div className="w-full border-b-2 border-dashed pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#DB2B30]/10">
                            <Briefcase className="w-5 h-5 text-[#DB2B30]" />
                        </div>
                        <h1 className="text-3xl font-bold">Clients</h1>
                    </div>
                    <p className="text-muted-foreground mt-2">
                        Manage and view your client relationships in one place.
                    </p>
                </div>

                <div className="w-full max-w-4xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Coming soon</CardTitle>
                            <CardDescription>
                                Client management tools are under development. Check back for updates.
                            </CardDescription>
                        </CardHeader>
                        <CardContent />
                    </Card>
                </div>
            </div>
        </RequireAuth>
    );
}
