import { Suspense } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import ThemeToggle from "./ThemeToggle";
import { Outlet, ScrollRestoration } from "react-router-dom";
import { siteConfig } from "@/config/site.config";

export default function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row relative">
      <Sidebar />
      <Header />

      {/* Desktop-only floating theme toggle in the top-right corner */}
      <div className="hidden md:block fixed top-6 right-8 z-50">
        <ThemeToggle />
      </div>

      {/* Main Content Area */}
      {/* Added left margin for sidebar offset on desktop */}
      <main className="flex-1 md:ml-20 lg:ml-48 min-h-screen relative w-full z-10">
        {/* Container for content - aligned slightly left or center, breathy */}
        <div className="w-full max-w-7xl mx-auto px-6 py-12 md:py-20 md:px-12 lg:px-24">
            <Suspense fallback={<div className="py-24 text-center text-stone-500 dark:text-stone-400">Loading...</div>}>
              <Outlet />
            </Suspense>
        </div>

        <footer className="py-12 mt-12 border-t border-stone-200/50 dark:border-stone-800/50 text-center text-xs text-stone-400 dark:text-stone-500 font-sans tracking-widest flex flex-col items-center gap-4">
            <div className="flex gap-6">
                {siteConfig.socialLinks.map((link) => (
                    <a
                        key={link.platform}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-stone-600 dark:hover:text-stone-300 transition-colors uppercase"
                    >
                        {link.label || link.platform}
                    </a>
                ))}
            </div>
            <span>&copy; {new Date().getFullYear()} {siteConfig.author.name}. All rights reserved.</span>
        </footer>
      </main>

      {/* Global Scroll Restoration */}
      <ScrollRestoration />
    </div>
  );
}
