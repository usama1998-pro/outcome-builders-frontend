"use client";

import { SiGoogledrive } from "react-icons/si";
import ComingSoonIntegrationPage from "../_components/ComingSoonIntegrationPage";

export default function GoogleDriveDataSourcePage() {
  return (
    <ComingSoonIntegrationPage
      title="Google Drive"
      description="Import documents and folders from Google Drive into Business Context."
      icon={SiGoogledrive}
    />
  );
}
