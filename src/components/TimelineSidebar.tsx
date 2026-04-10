// src/components/TimelineSidebar.tsx
import { LazyMotion, domAnimation, m } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Post } from "@/lib/posts";

interface TimelineSidebarProps {
  groups: Record<string, Record<string, Post[]>>; // year -> month -> posts
  activeYear?: string;
  onSelectYear: (year: string) => void;
}

export default function TimelineSidebar({ groups, activeYear, onSelectYear }: TimelineSidebarProps) {
  const years = Object.keys(groups).sort((a, b) => Number(b) - Number(a));

  return (
    <LazyMotion features={domAnimation}>
      <m.aside
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      // Moved to RIGHT side, visible on larger screens
      className="hidden xl:flex fixed right-12 top-1/2 -translate-y-1/2 flex-col items-center gap-4 z-40 w-12"
    >
      {/* Top Decor Line (Vertical) */}
      <div className="h-16 w-px bg-stone-300 dark:bg-stone-700 opacity-50" />

      <ul className="flex flex-col gap-4">
        {years.map((year) => (
          <li key={year} className="relative flex items-center justify-center">
            <button
              onClick={() => {
                 onSelectYear(year);
                 const el = document.getElementById(`year-${year}`);
                 el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={cn(
                "writing-vertical-rl text-sm tracking-[0.3em] font-serif transition-all duration-500 py-4 font-medium",
                activeYear === year
                    ? "text-foreground font-bold scale-110"
                    : "text-stone-400 dark:text-stone-500 hover:text-foreground"
              )}
            >
              <span className={cn(activeYear === year ? "border-l-4 border-foreground pl-2" : "")}>
                {year}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {/* Bottom Decor Line */}
      <div className="h-16 w-px bg-stone-300 dark:bg-stone-700 opacity-50" />

      <div className="writing-vertical-rl text-[9px] text-stone-200 dark:text-stone-700 mt-2">
        年表
      </div>
      </m.aside>
    </LazyMotion>
  );
}
