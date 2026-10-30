import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Website & Service Disclaimer — Nova Studio",
  description: "General disclaimer regarding automated shell scripts, technical demonstrations, and external tools.",
};

export default function DisclaimerPage() {
  return <LegalPageLayout slug="disclaimer" fallbackTitle="Disclaimer" />;
}

