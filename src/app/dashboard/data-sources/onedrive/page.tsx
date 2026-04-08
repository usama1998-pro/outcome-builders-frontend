"use client";

import { FaMicrosoft } from "react-icons/fa6";
import ComingSoonIntegrationPage from "../_components/ComingSoonIntegrationPage";

export default function OneDriveDataSourcePage() {
  return (
    <ComingSoonIntegrationPage
      title="OneDrive"
      description="Connect OneDrive files and folders as Business Context resources."
      icon={FaMicrosoft}
    />
  );
}
