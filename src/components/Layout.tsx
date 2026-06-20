import { Suspense } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import ThemeToggle from "./ThemeToggle";
import { Outlet, ScrollRestoration } from "react-router-dom";
import { siteConfig } from "@/config/site.config";

export default function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row relative">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true">
          {/* Subtle Vertical Lines (Traditional Stationery Pattern) */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
               style={{
                 backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px)',
                 backgroundSize: '80px 100%',
                 maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)'
               }}
          />

          {/* Ink Wash Blob - Top Right */}
          <div className="absolute -top-[20%] -right-[10%] w-[50vh] h-[50vh] bg-stone-900 dark:bg-stone-100 rounded-full opacity-[0.03] blur-[120px]" />

          {/* Ink Wash Blob - Bottom Left */}
          <div className="absolute bottom-[10%] -left-[10%] w-[40vh] h-[40vh] bg-stone-800 dark:bg-stone-200 rounded-full opacity-[0.02] blur-[100px]" />

          {/* Optional: Faint Branch Silhouette (very abstract) */}
          <svg className="absolute bottom-0 right-0 w-[30vh] h-[40vh] opacity-[0.03] dark:opacity-[0.06] text-stone-900 dark:text-stone-100" viewBox="0 0 100 200" preserveAspectRatio="none">
             <path d="M50 200 Q60 150 55 100 T70 0" stroke="currentColor" strokeWidth="2" fill="none"/>
             <path d="M55 120 Q80 110 90 90" stroke="currentColor" strokeWidth="1" fill="none"/>
             <path d="M52 160 Q20 150 10 130" stroke="currentColor" strokeWidth="1" fill="none"/>
          </svg>
      </div>

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
