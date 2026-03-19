"use client";

import { Route } from "lucide-react";
import ContextCategoryPage from "../_components/ContextCategoryPage";

export default function ProcessContextPage() {
  return (
    <ContextCategoryPage
      title="Process Context"
      description="Data resources about your processes and operations: procedures, workflows, and process-related files, video, audio, links, notes, and structured data."
      icon={Route}
      contextSlug="process-context"
    />
  );
}
