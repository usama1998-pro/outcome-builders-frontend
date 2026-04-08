"use client";

import { SiNotion } from "react-icons/si";
import ComingSoonIntegrationPage from "../_components/ComingSoonIntegrationPage";

export default function NotionDataSourcePage() {
  return (
    <ComingSoonIntegrationPage
      title="Notion"
      description="Sync workspace knowledge from Notion into Business Context."
      icon={SiNotion}
    />
  );
}
