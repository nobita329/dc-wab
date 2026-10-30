import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy — Nova Studio",
  description: "Understand how Nova Studio uses cookies and browser storage to power core functionality and security.",
};

export default function CookiePolicyPage() {
  return <LegalPageLayout slug="cookie-policy" fallbackTitle="Cookie Policy" />;
}

