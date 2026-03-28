"use client";

import { useState } from "react";
import Link from "next/link";
import RequireAuth from "@/src/components/auth/requireAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon, ChevronRight, Plus } from "lucide-react";
import { RESOURCE_TYPES } from "./resourceTypes";
import { DataContextSlug } from "./dataContextConfig";
import AddResourceDialog from "./AddResourceDialog";
import { useContextResourceCounts } from "@/src/hooks/useContextResourceCounts";

type ContextCategoryPageProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  /** URL segment e.g. customer-context — used for list links */
  contextSlug: DataContextSlug;
};

export default function ContextCategoryPage({
  title,
  description,
  icon: Icon,
  contextSlug,
}: ContextCategoryPageProps) {
  const [addResourceOpen, setAddResourceOpen] = useState(false);
  const { data: counts, isLoading: countsLoading } = useContextResourceCounts(contextSlug);

  return (
    <RequireAuth>
      <div className="flex w-full flex-col items-center gap-6 p-6">
        <div className="w-full border-b-2 border-dashed pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[#DB2B30]/10 p-2">
                <Icon className="h-5 w-5 text-[#DB2B30]" />
              </div>
              <h1 className="text-3xl font-bold">{title}</h1>
            </div>
            <Button
              type="button"
              className="shrink-0 bg-[#DB2B30] text-white hover:bg-[#DB2B30]/90"
              onClick={() => setAddResourceOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add resource
            </Button>
          </div>
          <p className="mt-2 text-muted-foreground">{description}</p>
        </div>

        <AddResourceDialog
          open={addResourceOpen}
          onOpenChange={setAddResourceOpen}
          contextName={title}
          contextSlug={contextSlug}
          resourceType="files"
          allowTypeSelection
        />

        <div className="w-full max-w-4xl">
          <p className="mb-4 text-sm text-muted-foreground">
            Use <strong>Add resource</strong> above to pick a type and fill the form, or open a type below for its{" "}
            <strong>list page</strong> (search, filters, and type-specific Add).
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {RESOURCE_TYPES.map(({ id, label, description: desc, icon: TypeIcon }) => {
              const href = `/dashboard/data-sources/${contextSlug}/${id}`;
              const n = counts?.[id] ?? 0;
              return (
                <Link key={id} href={href} className="group block">
                  <Card className="h-full transition-colors hover:border-[#DB2B30]/40 hover:bg-muted/50">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <div className="rounded-md bg-muted p-1.5">
                            <TypeIcon className="h-4 w-4 text-[#DB2B30]" />
                          </div>
                          <CardTitle className="text-base">{label}</CardTitle>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-foreground"
                            title={`${n} resource${n === 1 ? "" : "s"}`}
                          >
                            {countsLoading ? "…" : n.toLocaleString()}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-[#DB2B30]" />
                        </div>
                      </div>
                      <CardDescription className="text-xs">{desc}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs font-medium text-[#DB2B30]">View list →</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
