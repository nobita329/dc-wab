import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "DMCA & Copyright Policy — Nova Studio",
  description: "Review Nova Studio's DMCA takedown procedures, copyright notices, and intellectual property protection policies.",
};

export default function CopyrightPolicyPage() {
  return <LegalPageLayout slug="copyright-policy" fallbackTitle="Copyright Policy" />;
}

