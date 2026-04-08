"use client";

import { IconType } from "react-icons";
import RequireAuth from "@/src/components/auth/requireAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ComingSoonIntegrationPageProps = {
  title: string;
  description: string;
  icon: IconType;
};

export default function ComingSoonIntegrationPage({
  title,
  description,
  icon: Icon,
}: ComingSoonIntegrationPageProps) {
  return (
    <RequireAuth>
      <div className="flex min-h-[calc(100vh-5rem)] w-full items-center justify-center p-6">
        <div className="w-full max-w-3xl">
          <Card className="border-dashed">
            <CardHeader className="items-center text-center">
              <div className="rounded-2xl bg-[#DB2B30]/10 p-6">
                <Icon className="h-20 w-20 text-[#DB2B30]" />
              </div>
              <p className="text-sm font-medium text-[#DB2B30]">{title}</p>
              <CardTitle className="text-2xl">Coming soon</CardTitle>
              <CardDescription className="max-w-xl text-sm">
                {description}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              This integration is on the roadmap. We will share updates once it is available.
            </CardContent>
          </Card>
        </div>
      </div>
    </RequireAuth>
  );
}
