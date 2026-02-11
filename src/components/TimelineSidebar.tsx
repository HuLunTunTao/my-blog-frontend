// src/components/TimelineSidebar.tsx
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TimelineSidebarProps {
  groups: Record<string, Record<string, any[]>>; // year -> month -> posts
  activeYear?: string;
  onSelectYear: (year: string) => void;
}

export default function TimelineSidebar({ groups, activeYear, onSelectYear }: TimelineSidebarProps) {
  const years = Object.keys(groups).sort((a, b) => Number(b) - Number(a));

  return (
    <motion.aside 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="hidden 2xl:flex fixed left-12 top-1/2 -translate-y-1/2 flex-col items-center gap-4 z-50"
    >
      <div className="h-12 w-px bg-gradient-to-b from-transparent to-border" />
      
      <ul className="flex flex-col gap-3">
        {years.map((year) => (
          <li key={year} className="relative flex items-center justify-center">
            <button
              onClick={() => {
                 onSelectYear(year);
                 const el = document.getElementById(`year-${year}`);
                 el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={cn(
                "text-xs font-sans tracking-widest transition-all duration-300",
                activeYear === year 
                    ? "text-foreground font-semibold scale-110" 
                    : "text-neutral-300 hover:text-neutral-500"
              )}
            >
              {year}
            </button>
            {activeYear === year && (
                <motion.div 
                    layoutId="active-year-dot"
                    className="absolute -right-3 w-1 h-1 bg-foreground rounded-full"
                />
            )}
          </li>
        ))}
      </ul>
      
      <div className="h-12 w-px bg-gradient-to-t from-transparent to-border" />
    </motion.aside>
  );
}
