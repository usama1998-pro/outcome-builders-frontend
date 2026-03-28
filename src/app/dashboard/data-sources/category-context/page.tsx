"use client";

import { LayoutGrid } from "lucide-react";
import ContextCategoryPage from "../_components/ContextCategoryPage";

export default function CategoryContextPage() {
  return (
    <ContextCategoryPage
      title="Category Context"
      description="Categorized data resources for your business: groupings, themes, and category-related files, video, audio, links, notes, and structured data."
      icon={LayoutGrid}
      contextSlug="category-context"
    />
  );
}
