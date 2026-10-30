"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UserPlus,
  Lock,
  User,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    nameFirst: "",
    nameLast: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute live Gravatar URL preview based on email input
  const emailClean = formData.email.trim().toLowerCase();
  const gravatarPreviewUrl = emailClean
    ? `https://www.gravatar.com/avatar/${encodeURIComponent(emailClean)}?s=120&d=identicon`
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (formData.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post("/api/auth/register", {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        nameFirst: formData.nameFirst.trim(),
        nameLast: formData.nameLast.trim(),
      });

      if (res.data?.success && res.data.token) {
        setAuth(res.data.user, res.data.token);
        toast.success(`Account registered! Welcome to Nova Studio, ${res.data.user.username}!`);
        router.push("/admin");
      } else {
        setErrorMessage(res.data?.error || "Registration failed.");
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || "Registration error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-between items-center p-4 selection:bg-violet-600 selection:text-white">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-violet-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Top back link */}
      <header className="w-full max-w-6xl pt-6 px-4 flex justify-between items-center relative z-10">
        <Link href="/admin/login" className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors">
          <span>← Back to Login</span>
        </Link>
        <span className="text-xs text-zinc-500 font-mono">Nova Studio Auth</span>
      </header>

      {/* Main Register Card */}
      <div className="w-full max-w-md relative z-10 my-8">
        <Card className="border-white/10 bg-zinc-900/60 backdrop-blur-2xl shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 to-violet-600 shadow-lg shadow-violet-500/20 mb-3">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-white">
              Create Admin Account
            </CardTitle>
            <CardDescription className="text-zinc-400 text-xs mt-1">
              Join Nova Studio team & manage digital infrastructure
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
              {/* Names */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    First Name
                  </label>
                  <Input
                    type="text"
                    placeholder="Alex"
                    value={formData.nameFirst}
                    onChange={(e) => setFormData({ ...formData, nameFirst: e.target.value })}
                    className="bg-zinc-950/70 border-white/10 text-white placeholder:text-zinc-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Last Name
                  </label>
                  <Input
                    type="text"
                    placeholder="Morgan"
                    value={formData.nameLast}
                    onChange={(e) => setFormData({ ...formData, nameLast: e.target.value })}
                    className="bg-zinc-950/70 border-white/10 text-white placeholder:text-zinc-600 text-sm"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Username <span className="text-violet-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input
                    type="text"
                    placeholder="alexmorgan"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="pl-9 bg-zinc-950/70 border-white/10 text-white placeholder:text-zinc-600 text-sm"
                  />
                </div>
              </div>

              {/* Email with Usericon Preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Email Address <span className="text-violet-400">*</span>
                  </label>
                  {gravatarPreviewUrl && (
                    <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      <span>Gravatar Avatar Linked</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input
                    type="email"
                    placeholder="alex@novastudio.agency"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-9 bg-zinc-950/70 border-white/10 text-white placeholder:text-zinc-600 text-sm"
                  />
                </div>
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Password <span className="text-violet-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-9 bg-zinc-950/70 border-white/10 text-white placeholder:text-zinc-600 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Confirm Password <span className="text-violet-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="pl-9 bg-zinc-950/70 border-white/10 text-white placeholder:text-zinc-600 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="flex items-center gap-1.5 text-zinc-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  <span>{showPassword ? "Hide passwords" : "Show passwords"}</span>
                </button>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                variant="studio"
                className="w-full gap-2 mt-6 py-5 rounded-xl font-semibold shadow-lg shadow-violet-600/25"
              >
                <span>{isSubmitting ? "Creating Account..." : "Complete Registration"}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-zinc-400 pt-4 border-t border-white/5">
              <span>Already registered? </span>
              <Link href="/admin/login" className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline">
                Sign in to Admin
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <footer className="text-center py-4 text-xs text-zinc-600">
        Nova Studio © {new Date().getFullYear()} • Secure File-Based Database Architecture
      </footer>
    </div>
  );
}
