"use client";

import React from "react";
import Link from "next/link";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: { ordered: boolean; items: string[] } | null = null;
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  const flushList = (key: string) => {
    if (!currentList) return;
    if (currentList.ordered) {
      elements.push(
        <ol key={key} className="list-decimal pl-6 space-y-2 text-zinc-300 my-4 text-sm sm:text-base leading-relaxed">
          {currentList.items.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ol>
      );
    } else {
      elements.push(
        <ul key={key} className="list-disc pl-6 space-y-2 text-zinc-300 my-4 text-sm sm:text-base leading-relaxed">
          {currentList.items.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ul>
      );
    }
    currentList = null;
  };

  const renderInline = (text: string): React.ReactNode => {
    // Regex for inline code: `code`
    // Regex for links: [text](href)
    // Regex for bold: **bold**
    // Regex for italic: *italic*
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining.length > 0) {
      // Inline code
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        parts.push(
          <code
            key={keyIdx++}
            className="rounded bg-zinc-800/80 px-1.5 py-0.5 font-mono text-xs text-cyan-300 border border-white/10"
          >
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // Link
      const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        const [, linkText, linkHref] = linkMatch;
        const isInternal = linkHref.startsWith("/");
        if (isInternal) {
          parts.push(
            <Link
              key={keyIdx++}
              href={linkHref}
              className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 font-medium transition-colors"
            >
              {linkText}
            </Link>
          );
        } else {
          parts.push(
            <a
              key={keyIdx++}
              href={linkHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 font-medium transition-colors"
            >
              {linkText}
            </a>
          );
        }
        remaining = remaining.slice(linkMatch[0].length);
        continue;
      }

      // Bold
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        parts.push(
          <strong key={keyIdx++} className="font-semibold text-white">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Plain char
      const nextSpecial = remaining.search(/[`*\[]/);
      if (nextSpecial === -1) {
        parts.push(remaining);
        break;
      } else if (nextSpecial > 0) {
        parts.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      } else {
        // Character wasn't a valid match, consume 1 char
        parts.push(remaining[0]);
        remaining = remaining.slice(1);
      }
    }

    return <>{parts}</>;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        flushList(`list-before-code-${i}`);
        elements.push(
          <pre
            key={`code-${i}`}
            className="my-4 overflow-x-auto rounded-xl border border-white/10 bg-zinc-900/90 p-4 font-mono text-xs sm:text-sm text-zinc-200"
          >
            <code>{codeBlockLines.join("\n")}</code>
          </pre>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        flushList(`list-before-code-${i}`);
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    const trimmed = line.trim();

    // Horizontal rule
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      flushList(`list-${i}`);
      elements.push(<hr key={`hr-${i}`} className="my-8 border-white/10" />);
      continue;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      flushList(`list-${i}`);
      elements.push(
        <h3
          key={`h3-${i}`}
          className="mt-6 mb-2 text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2"
        >
          {renderInline(trimmed.slice(4))}
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushList(`list-${i}`);
      elements.push(
        <h2
          key={`h2-${i}`}
          className="mt-8 mb-4 text-xl sm:text-2xl font-bold tracking-tight text-white border-b border-white/5 pb-2"
        >
          {renderInline(trimmed.slice(3))}
        </h2>
      );
      continue;
    }

    if (trimmed.startsWith("# ")) {
      flushList(`list-${i}`);
      elements.push(
        <h1
          key={`h1-${i}`}
          className="mt-2 mb-6 text-2xl sm:text-4xl font-extrabold tracking-tight text-white"
        >
          {renderInline(trimmed.slice(2))}
        </h1>
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      flushList(`list-${i}`);
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="my-4 border-l-2 border-violet-500 bg-violet-500/5 px-4 py-2 text-sm text-zinc-300 italic rounded-r-lg"
        >
          {renderInline(trimmed.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Unordered List (- or *)
    if (/^[-*]\s+/.test(trimmed)) {
      const content = trimmed.replace(/^[-*]\s+/, "");
      if (!currentList || currentList.ordered) {
        flushList(`list-switch-${i}`);
        currentList = { ordered: false, items: [] };
      }
      currentList.items.push(content);
      continue;
    }

    // Ordered List (1. 2.)
    if (/^\d+\.\s+/.test(trimmed)) {
      const content = trimmed.replace(/^\d+\.\s+/, "");
      if (!currentList || !currentList.ordered) {
        flushList(`list-switch-${i}`);
        currentList = { ordered: true, items: [] };
      }
      currentList.items.push(content);
      continue;
    }

    // Empty lines flush list
    if (trimmed === "") {
      flushList(`list-empty-${i}`);
      continue;
    }

    // Regular Paragraph
    flushList(`list-p-${i}`);
    elements.push(
      <p key={`p-${i}`} className="my-3 text-sm sm:text-base leading-relaxed text-zinc-300">
        {renderInline(trimmed)}
      </p>
    );
  }

  flushList("list-final");

  return <div className="space-y-1">{elements}</div>;
}

