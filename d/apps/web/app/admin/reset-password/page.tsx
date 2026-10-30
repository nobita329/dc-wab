"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { toast } from "sonner";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage("Reset token is missing. Please initiate a new password reset.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("New password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post("/api/auth/reset-password", {
        token,
        password,
      });

      if (res.data?.success) {
        setIsSuccess(true);
        toast.success("Password reset successfully!");
      } else {
        setErrorMessage(res.data?.error || "Failed to reset password.");
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.error || "Invalid or expired reset token. Please request a new one."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <Card className="border-white/10 bg-zinc-900/60 backdrop-blur-2xl shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/30 mb-3">
            <AlertCircle className="h-6 w-6 text-amber-400" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-white">
            Missing Reset Token
          </CardTitle>
          <CardDescription className="text-zinc-400 text-xs mt-1">
            This password reset link is invalid or incomplete.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <p className="text-xs text-zinc-400 text-center leading-relaxed">
            Please make sure you copied the full reset link, or request a new password reset authorization.
          </p>
          <Button
            onClick={() => router.push("/admin/forgot-password")}
            variant="studio"
            className="w-full gap-2 py-4 rounded-xl font-semibold"
          >
            <span>Request New Reset Link</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div className="text-center pt-2">
            <Link
              href="/admin/login"
              className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card className="border-white/10 bg-zinc-900/60 backdrop-blur-2xl shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/30 mb-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            Password Updated
          </CardTitle>
          <CardDescription className="text-zinc-400 text-xs mt-1">
            Your account credentials have been securely updated in the database
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <p className="text-xs text-zinc-300 text-center leading-relaxed">
            You can now log in using your new password. All active sessions have been refreshed.
          </p>
          <Button
            onClick={() => router.push("/admin/login")}
            variant="studio"
            className="w-full gap-2 py-5 rounded-xl font-semibold shadow-lg shadow-violet-600/25"
          >
            <span>Sign In to Admin</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-zinc-900/60 backdrop-blur-2xl shadow-2xl">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20 mb-3">
          <KeyRound className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-white">
          Reset Password
        </CardTitle>
        <CardDescription className="text-zinc-400 text-xs mt-1">
          Set a new, secure password for your Nova Studio account
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                className="pl-9 pr-10 bg-zinc-950/70 border-white/10 text-white placeholder:text-zinc-600 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="pl-9 bg-zinc-950/70 border-white/10 text-white placeholder:text-zinc-600 text-sm"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-950/60 border border-white/5 text-[11px] text-zinc-400 space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
              <span>Password Security</span>
            </div>
            <p>Your password will be encrypted using bcrypt with salt rounds before storing.</p>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            variant="studio"
            className="w-full gap-2 mt-4 py-5 rounded-xl font-semibold shadow-lg shadow-violet-600/25"
          >
            <span>{isSubmitting ? "Updating Password..." : "Set New Password"}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          <div className="pt-2 text-center text-xs">
            <Link
              href="/admin/login"
              className="text-zinc-400 hover:text-white inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Cancel & Return to Login</span>
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
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
          <span>← Back to Login</span>
        </Link>
        <span className="text-xs text-zinc-500 font-mono">Nova Studio Auth</span>
      </header>

      {/* Main Card */}
      <div className="w-full max-w-md relative z-10 my-auto">
        <Suspense fallback={<div className="h-96 rounded-2xl bg-zinc-900/60 animate-pulse" />}>
          <ResetPasswordForm />
        </Suspense>
      </div>

      <footer className="text-center py-4 text-xs text-zinc-600">
        Nova Studio © {new Date().getFullYear()} • Secure File-Based Database Architecture
      </footer>
    </div>
  );
}
