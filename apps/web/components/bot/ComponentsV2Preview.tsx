"use client";

import { useState } from "react";
import {
  DiscordMessagePayload,
  DiscordComponentType,
  DiscordButtonStyle,
  DiscordSeparatorSpacing,
  DiscordTopLevelComponent,
  DiscordButtonComponent,
  DiscordSelectComponent,
} from "@nova/shared";
import {
  Monitor,
  Smartphone,
  Copy,
  Check,
  Code2,
  Eye,
  ExternalLink,
  ChevronDown,
  Info,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface ComponentsV2PreviewProps {
  payload: DiscordMessagePayload;
  botName?: string;
  botAvatar?: string;
  defaultAccentColor?: string;
  className?: string;
  interactive?: boolean;
}

export function ComponentsV2Preview({
  payload,
  botName = "Nova Assistant",
  botAvatar = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=256",
  defaultAccentColor = "#7c3aed",
  className = "",
  interactive = true,
}: ComponentsV2PreviewProps) {
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [activeTab, setActiveTab] = useState<"preview" | "json">("preview");
  const [copied, setCopied] = useState(false);
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});
  const [openSelectId, setOpenSelectId] = useState<string | null>(null);
  const [lastInteractionResult, setLastInteractionResult] = useState<string | null>(null);

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    toast.success("Components V2 JSON copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleButtonClick = async (btn: DiscordButtonComponent) => {
    if (!interactive) return;
    if (btn.style === DiscordButtonStyle.LINK && btn.url) {
      window.open(btn.url, "_blank");
      return;
    }

    try {
      toast.info(`Triggering button interaction: ${btn.custom_id || btn.label}`);
      const res = await api.post("/api/bot/test-interaction", {
        type: "button_click",
        customId: btn.custom_id,
      });

      if (res.data?.success) {
        setLastInteractionResult(
          `✅ Acknowledged button click for \`${btn.custom_id}\` (${res.data?.log?.latencyMs}ms)`
        );
        toast.success(`Button '${btn.label || btn.custom_id}' acknowledged!`);
      }
    } catch {
      toast.error("Interaction failed to log");
    }
  };

  const handleSelectOption = async (select: DiscordSelectComponent, val: string) => {
    setSelectedValues((prev) => ({ ...prev, [select.custom_id]: val }));
    setOpenSelectId(null);
    if (!interactive) return;

    try {
      const res = await api.post("/api/bot/test-interaction", {
        type: "select_option",
        customId: select.custom_id,
        selectedValues: [val],
      });
      if (res.data?.success) {
        setLastInteractionResult(
          `✅ Selected \`${val}\` on menu \`${select.custom_id}\` (${res.data?.log?.latencyMs}ms)`
        );
        toast.success(`Select menu '${val}' updated!`);
      }
    } catch {
      toast.error("Interaction failed to log");
    }
  };

  // Convert accent integer (e.g. 8141549) to hex string (#7c3aed)
  const formatAccentColor = (accent?: number): string => {
    if (accent === undefined || accent === null) return defaultAccentColor;
    return `#${accent.toString(16).padStart(6, "0")}`;
  };

  return (
    <div className={`flex flex-col rounded-xl border border-white/10 bg-zinc-950/90 shadow-2xl overflow-hidden ${className}`}>
      {/* Top Header / Viewport & Tab Switchers */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-zinc-900/60 text-xs">
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("preview")}
            className={`h-7 px-2.5 text-xs font-medium rounded-md gap-1.5 ${
              activeTab === "preview"
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Live Preview</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("json")}
            className={`h-7 px-2.5 text-xs font-medium rounded-md gap-1.5 ${
              activeTab === "json"
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Discord JSON</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "preview" && (
            <div className="flex items-center bg-zinc-950/60 p-0.5 rounded-lg border border-white/5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewport("desktop")}
                className={`h-6 px-2 text-[11px] gap-1 rounded ${
                  viewport === "desktop" ? "bg-white/10 text-white font-medium" : "text-zinc-400"
                }`}
                title="Desktop View (Full width)"
              >
                <Monitor className="h-3 w-3" />
                <span className="hidden sm:inline">Desktop</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewport("mobile")}
                className={`h-6 px-2 text-[11px] gap-1 rounded ${
                  viewport === "mobile" ? "bg-white/10 text-white font-medium" : "text-zinc-400"
                }`}
                title="Mobile View (Compact 380px)"
              >
                <Smartphone className="h-3 w-3" />
                <span className="hidden sm:inline">Mobile</span>
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={copyJson}
            className="h-7 px-2.5 text-xs text-zinc-400 hover:text-white border border-white/5 gap-1.5"
            title="Copy Discord Payload JSON"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied" : "Copy JSON"}</span>
          </Button>
        </div>
      </div>

      {/* Main Content Stage */}
      {activeTab === "json" ? (
        <div className="p-4 bg-zinc-950 text-xs font-mono overflow-auto max-h-[600px] text-zinc-300">
          <pre className="whitespace-pre-wrap">{JSON.stringify(payload, null, 2)}</pre>
        </div>
      ) : (
        <div className="p-4 sm:p-6 bg-[#313338] min-h-[420px] flex flex-col items-center justify-start overflow-y-auto max-h-[680px]">
          {/* Simulated Discord Channel Watermark Header */}
          <div className="w-full max-w-2xl mb-4 pb-2 border-b border-[#3f4147] flex items-center justify-between text-zinc-400 text-xs select-none">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 font-bold text-base">#</span>
              <span className="font-semibold text-zinc-200">announcements</span>
              <span className="text-[10px] text-zinc-400 border border-zinc-700 px-1.5 py-0.5 rounded">
                Components V2 Canvas
              </span>
            </div>
            <span className="text-[11px] text-zinc-400">Approximation (Official Discord V2 Rules)</span>
          </div>

          {/* Discord Message Container */}
          <div
            className={`transition-all duration-200 w-full ${
              viewport === "mobile" ? "max-w-[380px]" : "max-w-2xl"
            }`}
          >
            <div className="flex items-start gap-3.5 group">
              {/* Bot Avatar */}
              <img
                src={botAvatar}
                alt={botName}
                className="h-10 w-10 rounded-full object-cover shrink-0 select-none bg-zinc-800 border border-white/10"
              />

              {/* Message Body Column */}
              <div className="flex-1 min-w-0">
                {/* Bot Header Line */}
                <div className="flex items-center gap-1.5 mb-1 select-none">
                  <span className="text-sm font-semibold text-white hover:underline cursor-pointer">
                    {botName}
                  </span>
                  <span className="bg-[#5865f2] text-white text-[9px] font-bold px-1 py-0.5 rounded uppercase leading-none tracking-wider">
                    BOT
                  </span>
                  <span className="text-[11px] text-[#949ba4] ml-1">Today at 4:20 PM</span>
                </div>

                {/* Optional Message Content Text */}
                {payload.content && (
                  <div className="text-sm text-[#dbdee1] mb-2 leading-relaxed">
                    {renderMarkdown(payload.content)}
                  </div>
                )}

                {/* Components Tree */}
                <div className="space-y-2 w-full">
                  {(payload.components || []).map((component, idx) => (
                    <ComponentRenderer
                      key={component.id || `comp-${idx}`}
                      component={component}
                      formatAccentColor={formatAccentColor}
                      onButtonClick={handleButtonClick}
                      onSelectOption={handleSelectOption}
                      selectedValues={selectedValues}
                      openSelectId={openSelectId}
                      setOpenSelectId={setOpenSelectId}
                    />
                  ))}
                </div>

                {/* Last Interaction Feedback Banner */}
                {lastInteractionResult && (
                  <div className="mt-3 p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between animate-in fade-in duration-200">
                    <span>{lastInteractionResult}</span>
                    <button
                      onClick={() => setLastInteractionResult(null)}
                      className="text-emerald-400 hover:text-emerald-200 text-[10px]"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// Component Recursive Renderer
// ==========================================
function ComponentRenderer({
  component,
  formatAccentColor,
  onButtonClick,
  onSelectOption,
  selectedValues,
  openSelectId,
  setOpenSelectId,
}: {
  component: DiscordTopLevelComponent | any;
  formatAccentColor: (accent?: number) => string;
  onButtonClick: (btn: DiscordButtonComponent) => void;
  onSelectOption: (select: DiscordSelectComponent, val: string) => void;
  selectedValues: Record<string, string>;
  openSelectId: string | null;
  setOpenSelectId: (id: string | null) => void;
}) {
  if (!component) return null;

  switch (component.type) {
    // ----------------------------------------
    // Container (Type 15)
    // ----------------------------------------
    case DiscordComponentType.CONTAINER:
    case 15: {
      const accent = formatAccentColor(component.accent_color);
      return (
        <div
          className="rounded-lg bg-[#2b2d31] p-3.5 space-y-3 relative overflow-hidden shadow-sm"
          style={{
            borderLeft: `4px solid ${accent}`,
          }}
        >
          {(component.components || []).map((child: any, cIdx: number) => (
            <ComponentRenderer
              key={child.id || `child-${cIdx}`}
              component={child}
              formatAccentColor={formatAccentColor}
              onButtonClick={onButtonClick}
              onSelectOption={onSelectOption}
              selectedValues={selectedValues}
              openSelectId={openSelectId}
              setOpenSelectId={setOpenSelectId}
            />
          ))}
        </div>
      );
    }

    // ----------------------------------------
    // Section (Type 9)
    // ----------------------------------------
    case DiscordComponentType.SECTION:
    case 9: {
      return (
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            {(component.components || []).map((text: any, tIdx: number) => (
              <div key={tIdx} className="text-sm text-[#dbdee1] leading-relaxed">
                {renderMarkdown(text.content || "")}
              </div>
            ))}
          </div>

          {/* Section Accessory */}
          {component.accessory && (
            <div className="shrink-0 self-center">
              {component.accessory.type === DiscordComponentType.BUTTON || component.accessory.type === 2 ? (
                <RenderButton button={component.accessory} onClick={onButtonClick} />
              ) : component.accessory.type === DiscordComponentType.THUMBNAIL || component.accessory.type === 11 ? (
                <img
                  src={component.accessory.media?.url}
                  alt={component.accessory.media?.description || "Thumbnail"}
                  className="h-16 w-16 rounded-md object-cover bg-zinc-900 border border-white/10"
                />
              ) : null}
            </div>
          )}
        </div>
      );
    }

    // ----------------------------------------
    // Text Display (Type 10)
    // ----------------------------------------
    case DiscordComponentType.TEXT_DISPLAY:
    case 10: {
      return (
        <div className="text-sm text-[#dbdee1] leading-relaxed whitespace-pre-line">
          {renderMarkdown(component.content || "")}
        </div>
      );
    }

    // ----------------------------------------
    // Separator (Type 14)
    // ----------------------------------------
    case DiscordComponentType.SEPARATOR:
    case 14: {
      const spacingClass =
        component.spacing === DiscordSeparatorSpacing.LARGE || component.spacing === 3
          ? "my-4"
          : component.spacing === DiscordSeparatorSpacing.SMALL || component.spacing === 1
          ? "my-1"
          : "my-2.5";

      if (component.divider === false) {
        return <div className={spacingClass} />;
      }
      return <hr className={`border-[#3f4147] ${spacingClass}`} />;
    }

    // ----------------------------------------
    // Media Gallery (Type 12)
    // ----------------------------------------
    case DiscordComponentType.MEDIA_GALLERY:
    case 12: {
      const items = component.items || [];
      const count = items.length;
      return (
        <div
          className={`grid gap-2 w-full rounded-lg overflow-hidden my-1 ${
            count === 1
              ? "grid-cols-1"
              : count === 2
              ? "grid-cols-2"
              : "grid-cols-2 sm:grid-cols-3"
          }`}
        >
          {items.map((item: any, mIdx: number) => (
            <div
              key={mIdx}
              className="relative aspect-video rounded-md overflow-hidden bg-zinc-900 border border-white/5 group"
            >
              <img
                src={item.media?.url}
                alt={item.media?.description || `Media item ${mIdx + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                loading="lazy"
              />
              {item.media?.description && (
                <span className="absolute bottom-1 left-1 text-[9px] bg-black/70 px-1 rounded text-zinc-300">
                  {item.media.description}
                </span>
              )}
            </div>
          ))}
        </div>
      );
    }

    // ----------------------------------------
    // Action Row (Type 1)
    // ----------------------------------------
    case DiscordComponentType.ACTION_ROW:
    case 1: {
      const children = component.components || [];
      return (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {children.map((child: any, cIdx: number) => {
            if (child.type === DiscordComponentType.BUTTON || child.type === 2) {
              return (
                <RenderButton
                  key={child.id || `btn-${cIdx}`}
                  button={child}
                  onClick={onButtonClick}
                />
              );
            }
            if ([3, 5, 6, 7, 8].includes(child.type)) {
              return (
                <RenderSelect
                  key={child.id || `select-${cIdx}`}
                  select={child}
                  onSelectOption={onSelectOption}
                  selectedValue={selectedValues[child.custom_id]}
                  isOpen={openSelectId === child.custom_id}
                  toggleOpen={() =>
                    setOpenSelectId(openSelectId === child.custom_id ? null : child.custom_id)
                  }
                />
              );
            }
            return null;
          })}
        </div>
      );
    }

    default:
      return null;
  }
}

// ==========================================
// Button Component Renderer
// ==========================================
function RenderButton({
  button,
  onClick,
}: {
  button: DiscordButtonComponent;
  onClick: (btn: DiscordButtonComponent) => void;
}) {
  let styleClasses = "bg-[#4e5058] hover:bg-[#6d6f78] text-white"; // Secondary default

  if (button.style === DiscordButtonStyle.PRIMARY || button.style === 1) {
    styleClasses = "bg-[#5865f2] hover:bg-[#4752c4] text-white"; // Blurple
  } else if (button.style === DiscordButtonStyle.SUCCESS || button.style === 3) {
    styleClasses = "bg-[#248046] hover:bg-[#1a6334] text-white"; // Green
  } else if (button.style === DiscordButtonStyle.DANGER || button.style === 4) {
    styleClasses = "bg-[#da373c] hover:bg-[#a1282c] text-white"; // Red
  } else if (button.style === DiscordButtonStyle.LINK || button.style === 5) {
    styleClasses = "bg-[#4e5058] hover:bg-[#6d6f78] text-white"; // Link
  }

  return (
    <button
      onClick={() => onClick(button)}
      disabled={button.disabled}
      className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-medium transition-colors shadow-sm select-none ${styleClasses} ${
        button.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95"
      }`}
    >
      {button.emoji?.name && <span>{button.emoji.name}</span>}
      {button.label && <span>{button.label}</span>}
      {button.style === DiscordButtonStyle.LINK && <ExternalLink className="h-3 w-3 ml-0.5 opacity-80" />}
    </button>
  );
}

// ==========================================
// Select Menu Renderer
// ==========================================
function RenderSelect({
  select,
  onSelectOption,
  selectedValue,
  isOpen,
  toggleOpen,
}: {
  select: DiscordSelectComponent;
  onSelectOption: (select: DiscordSelectComponent, val: string) => void;
  selectedValue?: string;
  isOpen: boolean;
  toggleOpen: () => void;
}) {
  const options = select.options || [];
  const selectedOpt = options.find((o) => o.value === selectedValue);

  return (
    <div className="relative w-full my-1">
      <button
        type="button"
        onClick={toggleOpen}
        disabled={select.disabled}
        className={`w-full flex items-center justify-between px-3 py-2 rounded bg-[#1e1f22] border border-[#3f4147] text-left text-xs text-white hover:border-[#5865f2] transition-colors ${
          select.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <span className="truncate text-zinc-300">
          {selectedOpt ? (
            <span className="flex items-center gap-1.5 font-medium text-white">
              {selectedOpt.emoji?.name && <span>{selectedOpt.emoji.name}</span>}
              <span>{selectedOpt.label}</span>
            </span>
          ) : (
            <span className="text-zinc-400">{select.placeholder || "Select an option..."}</span>
          )}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Options */}
      {isOpen && options.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-md bg-[#2b2d31] border border-[#3f4147] shadow-xl py-1 max-h-60 overflow-y-auto">
          {options.map((opt, oIdx) => (
            <div
              key={oIdx}
              onClick={() => onSelectOption(select, opt.value)}
              className="px-3 py-2 hover:bg-[#35373c] cursor-pointer flex items-center justify-between text-xs transition-colors"
            >
              <div>
                <p className="font-semibold text-white flex items-center gap-1.5">
                  {opt.emoji?.name && <span>{opt.emoji.name}</span>}
                  <span>{opt.label}</span>
                </p>
                {opt.description && <p className="text-[11px] text-zinc-400 mt-0.5">{opt.description}</p>}
              </div>
              {opt.value === selectedValue && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// Discord Markdown Formatter
// ==========================================
function renderMarkdown(raw: string) {
  if (!raw) return null;

  // Split by code blocks first
  const parts = raw.split(/(```[\s\S]*?```)/g);

  return parts.map((part, pIdx) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const content = part.slice(3, -3);
      const firstLineBreak = content.indexOf("\n");
      const code = firstLineBreak !== -1 ? content.slice(firstLineBreak + 1) : content;
      return (
        <pre
          key={pIdx}
          className="bg-[#1e1f22] p-2.5 rounded border border-[#3f4147] text-xs font-mono text-[#dbdee1] overflow-x-auto my-1.5"
        >
          <code>{code}</code>
        </pre>
      );
    }

    // Process line-by-line
    const lines = part.split("\n");
    return (
      <span key={pIdx}>
        {lines.map((line, lIdx) => {
          let rendered: any = line;

          // Header ###
          if (line.startsWith("### ")) {
            return (
              <h3 key={lIdx} className="text-base font-bold text-white mt-1 mb-0.5">
                {line.slice(4)}
              </h3>
            );
          }
          if (line.startsWith("## ")) {
            return (
              <h2 key={lIdx} className="text-lg font-bold text-white mt-1 mb-0.5">
                {line.slice(3)}
              </h2>
            );
          }
          if (line.startsWith("# ")) {
            return (
              <h1 key={lIdx} className="text-xl font-extrabold text-white mt-1.5 mb-1">
                {line.slice(2)}
              </h1>
            );
          }

          // Bold **text**
          rendered = renderInlineFormatting(line);

          return (
            <span key={lIdx} className="block">
              {rendered}
            </span>
          );
        })}
      </span>
    );
  });
}

function renderInlineFormatting(str: string) {
  // Simple token parser for **bold**, *italic*, `code`, <#channel>
  const tokens = str.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|<#\w+>)/g);
  return tokens.map((token, i) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith("*") && token.endsWith("*")) {
      return (
        <em key={i} className="italic text-zinc-300">
          {token.slice(1, -1)}
        </em>
      );
    }
    if (token.startsWith("`") && token.endsWith("`")) {
      return (
        <code key={i} className="bg-[#1e1f22] px-1 py-0.5 rounded text-xs font-mono text-[#e0af68]">
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith("<#") && token.endsWith(">")) {
      return (
        <span key={i} className="bg-[#3c4270]/40 text-[#c9cdfb] px-1 rounded font-medium hover:underline cursor-pointer">
          #{token.slice(2, -1)}
        </span>
      );
    }
    return token;
  });
}
