import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Nova Studio",
  description: "Learn how Nova Studio collects, safeguards, and processes your data in compliance with GDPR, CCPA, and global privacy standards.",
};

export default function PrivacyPolicyPage() {
  return <LegalPageLayout slug="privacy-policy" fallbackTitle="Privacy Policy" />;
}

