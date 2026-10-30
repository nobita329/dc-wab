"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetData, setResetData] = useState<{
    resetToken?: string;
    resetUrl?: string;
    message?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage("Please enter your username or email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await api.post("/api/auth/forgot-password", {
        emailOrUsername: identifier.trim(),
      });

      if (res.data?.success) {
        setResetData({
          resetToken: res.data.resetToken,
          resetUrl: res.data.resetUrl,
          message: res.data.message,
        });
        toast.success("Password reset authorization created!");
      } else {
        setErrorMessage(res.data?.error || "Failed to process request");
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.error || "Unable to request password reset. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!resetData?.resetUrl) return;
    const fullUrl = `${window.location.origin}${resetData.resetUrl}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Reset link copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-between items-center p-4 selection:bg-violet-600 selection:text-white">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-violet-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Top back link */}
      <header className="w-full max-w-6xl pt-6 px-4 flex justify-between items-center relative z-10">
        <Link
          href="/admin/login"
          className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Login</span>
        </Link>
        <span className="text-xs text-zinc-500 font-mono">Nova Studio Auth</span>
      </header>

      {/* Main Card */}
      <div className="w-full max-w-md relative z-10 my-auto">
        <Card className="border-white/10 bg-zinc-900/60 backdrop-blur-2xl shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20 mb-3">
              <KeyRound className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-white">
              Forgot Password
            </CardTitle>
            <CardDescription className="text-zinc-400 text-xs mt-1">
              Recover access to your Nova Studio administrator account
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            {errorMessage && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {resetData ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-300 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-emerald-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Reset Authorization Generated</span>
                  </div>
                  <p className="text-emerald-300/90 leading-relaxed">
                    {resetData.message ||
                      "A password reset link has been generated for your account with 1-hour validity."}
                  </p>
                </div>

                {resetData.resetUrl && (
                  <div className="rounded-xl border border-violet-500/30 bg-violet-950/40 p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-violet-200">
                      <span className="flex items-center gap-1.5">
                        <KeyRound className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Direct Reset Authorization</span>
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-violet-600/30 text-violet-300">
                        1-Hour Token
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Your single-use password reset authorization is ready:
                    </p>

                    <div className="flex items-center gap-2 bg-zinc-950/80 p-2.5 rounded-lg border border-white/10 text-xs font-mono text-zinc-300 break-all select-all">
                      <span className="truncate flex-1">{resetData.resetUrl}</span>
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white shrink-0 transition-colors"
                        title="Copy reset link"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <Button
                      onClick={() => router.push(resetData.resetUrl!)}
                      variant="studio"
                      className="w-full gap-2 py-4 rounded-xl font-semibold shadow-md"
                    >
                      <span>Proceed to Reset Password</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="pt-2 text-center">
                  <Link
                    href="/admin/login"
                    className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Return to Sign In</span>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Username or Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                      type="text"
                      placeholder="admin or admin@novastudio.internal"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                      autoFocus
                      className="pl-9 bg-zinc-950/70 border-white/10 text-white placeholder:text-zinc-600 text-sm"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-zinc-500">
                    Enter either your username (e.g. <span className="font-mono text-zinc-400">admin</span>) or registered email address.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant="studio"
                  className="w-full gap-2 mt-4 py-5 rounded-xl font-semibold shadow-lg shadow-violet-600/25"
                >
                  <span>{isSubmitting ? "Generating Reset Key..." : "Send Password Reset Link"}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <div className="pt-4 text-center text-xs text-zinc-400">
                  <span>Remembered your password? </span>
                  <Link
                    href="/admin/login"
                    className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline"
                  >
                    Sign In
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <footer className="text-center py-4 text-xs text-zinc-600">
        Nova Studio © {new Date().getFullYear()} • Secure File-Based Database Architecture
      </footer>
    </div>
  );
}
