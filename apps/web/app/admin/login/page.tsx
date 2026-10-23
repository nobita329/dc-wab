"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";
import Link from "next/link";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
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

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "admin",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await api.post("/api/auth/login", data);
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

  const handleFillDemo = () => {
    setValue("username", "admin");
    setValue("password", "admin");
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
          Protected administration interface & database controls
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        {errorMessage && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                {...register("username")}
                placeholder="admin"
                className="pl-9 bg-zinc-950/70 border-white/10 text-white placeholder:text-zinc-600"
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
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-9 pr-10 bg-zinc-950/70 border-white/10 text-white placeholder:text-zinc-600"
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

        {/* Quick Demo Credentials Helper */}
        <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
          <span className="text-[11px] text-zinc-500">
            Default: <code className="text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded">admin</code> / <code className="text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded">admin</code>
          </span>
          <button
            type="button"
            onClick={handleFillDemo}
            className="text-[11px] text-violet-400 hover:text-violet-300 underline underline-offset-4"
          >
            Auto-fill credentials
          </button>
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

