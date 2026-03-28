"use client";

import { Target } from "lucide-react";
import ContextCategoryPage from "../_components/ContextCategoryPage";

export default function CompetitorContextPage() {
  return (
    <ContextCategoryPage
      title="Competitor Context"
      description="Data resources about competitors and your market: positioning, intel, filings, and competitor-related files, video, audio, links, notes, and structured data."
      icon={Target}
      contextSlug="competitor-context"
    />
  );
}
