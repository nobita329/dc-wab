"use client";

import "./globals.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { useAuthStore, useThemeStore } from "@/lib/store";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { initializeAuth } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    initializeAuth();
    // Initialize theme class
    const savedTheme = localStorage.getItem("nova_theme");
    if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, [initializeAuth]);

  return (
    <html lang="en" className={theme === "light" ? "" : "dark"}>
      <head>
        <title>Nova Studio — Modern Creative & Engineering Studio</title>
        <meta
          name="description"
          content="Nova Studio creates high-performance digital experiences, modern web applications, and immersive brand designs."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-zinc-950 text-zinc-100 antialiased min-h-screen">
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster
            theme={theme === "light" ? "light" : "dark"}
            position="bottom-right"
            richColors
            closeButton
          />
        </QueryClientProvider>
      </body>
    </html>
  );
}

