import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions — Nova Studio",
  description: "Review the terms and conditions governing the use of Nova Studio's website, showcases, and digital services.",
};

export default function TermsAndConditionsPage() {
  return <LegalPageLayout slug="terms-and-conditions" fallbackTitle="Terms and Conditions" />;
}

