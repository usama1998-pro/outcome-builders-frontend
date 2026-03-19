"use client";

import { Package } from "lucide-react";
import ContextCategoryPage from "../_components/ContextCategoryPage";

export default function SupplierContextPage() {
  return (
    <ContextCategoryPage
      title="Supplier Context"
      description="Data resources about your suppliers and partners: contracts, performance data, and supplier-related files, video, audio, links, notes, and structured data."
      icon={Package}
      contextSlug="supplier-context"
    />
  );
}
