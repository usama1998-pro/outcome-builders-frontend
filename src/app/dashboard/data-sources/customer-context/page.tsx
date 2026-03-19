"use client";

import { Users } from "lucide-react";
import ContextCategoryPage from "../_components/ContextCategoryPage";

export default function CustomerContextPage() {
  return (
    <ContextCategoryPage
      title="Customer Context"
      description="Data resources about your customers: feedback, research, segments, and customer-related files, video, audio, links, notes, and structured data."
      icon={Users}
      contextSlug="customer-context"
    />
  );
}
