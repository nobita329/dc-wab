import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account & Data Deletion Instructions — Nova Studio",
  description: "Step-by-step instructions for requesting permanent erasure of your personal data and accounts under GDPR and CCPA.",
};

export default function DataDeletionPage() {
  return <LegalPageLayout slug="data-deletion" fallbackTitle="Data Deletion & Erasure" />;
}

