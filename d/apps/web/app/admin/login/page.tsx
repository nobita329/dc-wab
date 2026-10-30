"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";
import Link from "next/link";

const loginSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
  twoFactorCode: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/admin";
  const { setAuth } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorInput, setTwoFactorInput] = useState("");
  const [savedCredentials, setSavedCredentials] = useState<{ username: string; password: string } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        username: data.username,
        password: data.password,
        twoFactorCode: requires2FA ? twoFactorInput.trim() : undefined,
      };

      const res = await api.post("/api/auth/login", payload);

      if (res.data?.requireTwoFactor) {
        setRequires2FA(true);
        setSavedCredentials({ username: data.username, password: data.password });
        toast.info("Please enter your Two-Factor Authentication (2FA) code");
        setIsSubmitting(false);
        return;
      }

      if (res.data?.success && res.data.token) {
        setAuth(res.data.user, res.data.token);
        toast.success(`Welcome back, ${res.data.user.username}!`);
        router.push(redirectUrl);
      } else {
        setErrorMessage(res.data?.error || "Login failed");
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.error || "Authentication failed. Check credentials."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorInput.trim() || !savedCredentials) {
      toast.error("Please enter a 6-digit TOTP code or backup code");
      return;
    }

    onSubmit({
      username: savedCredentials.username,
      password: savedCredentials.password,
      twoFactorCode: twoFactorInput.trim(),
    });
  };

  return (
    <Card className="border-white/10 bg-zinc-900/60 backdrop-blur-2xl shadow-2xl">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20 mb-3">
          <ShieldCheck className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-white">
          Nova Studio Admin
        </CardTitle>
        <CardDescription className="text-zinc-400 text-xs mt-1">
          {requires2FA
            ? "Two-Factor Authentication Verification"
            : "Protected administration interface & database controls"}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {requires2FA ? (
          /* Step 2: 2FA TOTP Form */
          <form onSubmit={handle2FASubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-violet-600/10 border border-violet-500/20 text-xs text-violet-300 flex items-center gap-2.5">
              <KeyRound className="h-4 w-4 shrink-0 text-cyan-400" />
              <span>Enter the 6-digit code from Google Authenticator or your recovery backup code.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Authentication Code
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <Input
                  type="text"
                  placeholder="123456 or ABCD-1234"
                  value={twoFactorInput}
                  onChange={(e) => setTwoFactorInput(e.target.value)}
                  autoFocus
                  required
                  className="pl-9 bg-zinc-950/70 border-white/10 text-white placeholder:text-zinc-600 font-mono tracking-widest text-center text-base"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              variant="studio"
              className="w-full gap-2 mt-4 py-5 rounded-xl font-semibold shadow-lg shadow-violet-600/25"
            >
              <span>{isSubmitting ? "Verifying..." : "Verify & Sign In"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <button
              type="button"
              onClick={() => {
                setRequires2FA(false);
                setErrorMessage(null);
              }}
              className="w-full text-center text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-1.5 pt-2 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to password</span>
            </button>
          </form>
        ) : (
          /* Step 1: Username & Password Form */
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <Input
                  {...register("username")}
                  placeholder="admin or admin@novastudio.internal"
                  className="pl-9 bg-zinc-950/70 border-white/10 text-white placeholder:text-zinc-600 text-sm"
                  autoComplete="username"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-[11px] text-red-400">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  Password
                </label>
                <Link
                  href="/admin/forgot-password"
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <Input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-9 pr-10 bg-zinc-950/70 border-white/10 text-white placeholder:text-zinc-600 text-sm"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-[11px] text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              variant="studio"
              className="w-full gap-2 mt-6 py-5 rounded-xl font-semibold shadow-lg shadow-violet-600/25"
            >
              <span>{isSubmitting ? "Authenticating..." : "Sign In to Admin"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        )}

        {/* Register Link */}
        <div className="mt-6 text-center text-xs text-zinc-400">
          <span>Don't have an account? </span>
          <Link href="/admin/register" className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline">
            Register Account
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-between items-center p-4 selection:bg-violet-600 selection:text-white">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-violet-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Top back link */}
      <header className="w-full max-w-6xl pt-6 px-4 flex justify-between items-center relative z-10">
        <Link href="/" className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors">
          <span>← Back to Nova Studio</span>
        </Link>
        <span className="text-xs text-zinc-500 font-mono">Port 3001 (Web) • 3002 (API)</span>
      </header>

      {/* Main Login Card */}
      <div className="w-full max-w-md relative z-10 my-auto">
        <Suspense fallback={<div className="h-96 rounded-2xl bg-zinc-900/60 animate-pulse" />}>
          <LoginFormContent />
        </Suspense>
      </div>

      <footer className="text-center py-4 text-xs text-zinc-600">
        Nova Studio © {new Date().getFullYear()} • Secure File-Based Database Architecture
      </footer>
    </div>
  );
}
