"use client";

import RequireAuth from "@/src/components/auth/requireAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileAudio } from "lucide-react";

export default function AudioDataSourcesPage() {
  return (
    <RequireAuth>
      <div className="w-full h-full flex flex-col items-center p-6 gap-6">
        <div className="w-full border-b-2 border-dashed pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <FileAudio className="w-5 h-5 text-violet-500" />
            </div>
            <h1 className="text-3xl font-bold">Audio</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Manage audio sources for your knowledge bank.
          </p>
        </div>

        <div className="w-full max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Coming soon</CardTitle>
              <CardDescription>
                Audio ingestion and management will appear here.
              </CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        </div>
      </div>
    </RequireAuth>
  );
}

