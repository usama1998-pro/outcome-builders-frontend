"use client";

import { useState } from "react";
import Link from "next/link";
import RequireAuth from "@/src/components/auth/requireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronRight, Plus } from "lucide-react";
import { getResourceType, ResourceTypeId } from "./resourceTypes";
import { DataContextSlug, getDataContext } from "./dataContextConfig";
import AddResourceDialog from "./AddResourceDialog";

type ResourceListPageProps = {
  contextSlug: DataContextSlug;
  resourceTypeId: ResourceTypeId;
};

export default function ResourceListPage({ contextSlug, resourceTypeId }: ResourceListPageProps) {
  const ctx = getDataContext(contextSlug);
  const typeMeta = getResourceType(resourceTypeId);
  const TypeIcon = typeMeta.icon;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const title = ctx?.title ?? "Context";

  // Placeholder until API is wired; filters are ready for query params
  const rows: { id: string; name: string; updated: string }[] = [];

  return (
    <RequireAuth>
      <div className="flex w-full flex-col gap-6 p-6">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <Link href={`/dashboard/data-sources/${contextSlug}`} className="hover:text-foreground">
            {title}
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <span className="font-medium text-foreground">{typeMeta.label}</span>
        </nav>

        <div className="flex flex-col gap-4 border-b border-dashed pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-[#DB2B30]/10 p-2">
              <TypeIcon className="h-6 w-6 text-[#DB2B30]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{typeMeta.label}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{typeMeta.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Context: <span className="font-medium text-foreground">{title}</span>
              </p>
            </div>
          </div>
          <Button
            type="button"
            className="shrink-0 bg-[#DB2B30] text-white hover:bg-[#B52227]"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add {typeMeta.label}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <label htmlFor="resource-search" className="text-sm font-medium">
              Search
            </label>
            <Input
              id="resource-search"
              placeholder="Search by name or content…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full space-y-2 sm:w-48">
            <span className="text-sm font-medium">Status</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* List / table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="text-right">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                    No resources yet. Use <strong className="text-foreground">Add {typeMeta.label}</strong> to
                    create one.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">{row.updated}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{row.updated}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <AddResourceDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          contextName={`${title} · ${typeMeta.label}`}
          resourceType={resourceTypeId}
        />
      </div>
    </RequireAuth>
  );
}
