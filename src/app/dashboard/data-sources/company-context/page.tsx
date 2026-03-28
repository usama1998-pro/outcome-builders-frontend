"use client";

import { Building2 } from "lucide-react";
import ContextCategoryPage from "../_components/ContextCategoryPage";

export default function CompanyContextPage() {
  return (
    <ContextCategoryPage
      title="Company Context"
      description="Company-level data resources: brand, culture, policies, and internal files, video, audio, links, notes, and structured data."
      icon={Building2}
      contextSlug="company-context"
    />
  );
}
