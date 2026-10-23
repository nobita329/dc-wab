"use client";

import { useState } from "react";
import { Check, Copy, Terminal, Sparkles } from "lucide-react";
import { CommandSection as CommandSectionType } from "@nova/shared";
import { toast } from "sonner";

interface CommandSectionProps {
  commandSection?: CommandSectionType;
}

export function CommandSection({ commandSection }: CommandSectionProps) {
  const [copied, setCopied] = useState(false);

  // If disabled, return null
  if (commandSection?.enabled === false) return null;

  const badge = commandSection?.badge || "AUTOMATED SCRIPT";
  const title = commandSection?.title || "ALL IN ONE";
  const highlightText = commandSection?.highlightText || "CMD";
  const description =
    commandSection?.description ||
    "Execute the master script to install all dependencies instantly.";
  const command =
    commandSection?.command || "bash <(curl -s https://ptero.nobitahost.in)";

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(command);
      } else {
        // Fallback
        const textArea = document.createElement("textarea");
        textArea.value = command;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      toast.success("Command copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy command");
    }
  };

  return (
    <section className="relative py-12 sm:py-16 overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="container relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#0e111a]/90 via-zinc-950/90 to-zinc-950 p-8 sm:p-12 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Subtle top border glow */}
          <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

          {/* Badge */}
          {badge && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-6 shadow-sm">
              <Sparkles className="h-3 w-3 text-cyan-400" />
              <span>{badge}</span>
            </div>
          )}

          {/* Headline */}
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-none">
            {title}{" "}
            <span className="text-cyan-400 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              {highlightText}
            </span>
          </h2>

          {/* Subtitle */}
          <p className="mt-3 text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
            {description}
          </p>

          {/* Terminal Command Box */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-black/70 p-3 sm:p-4 flex items-center justify-between gap-4 font-mono shadow-inner group">
            <div className="flex items-center gap-3 min-w-0 flex-1 pl-1">
              <span className="text-cyan-400 font-bold select-none text-base sm:text-lg">
                $
              </span>
              <code className="text-zinc-100 font-medium select-all truncate text-xs sm:text-sm tracking-wide">
                {command}
              </code>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all duration-200 flex items-center gap-1.5 active:scale-95 ${
                copied
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm"
                  : "bg-zinc-800 hover:bg-zinc-700 text-white border-white/10 hover:border-cyan-500/30 shadow-md"
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>COPIED</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-zinc-400 group-hover:text-cyan-400 transition-colors" />
                  <span>COPY</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
