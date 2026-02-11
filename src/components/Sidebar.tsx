import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const location = useLocation();
  const path = location.pathname;

  const navItems = [
    { name: "Time", path: "/", zh: "岁" },
    { name: "Folders", path: "/folders", zh: "录" },
    { name: "Tags", path: "/tags", zh: "类" },
    { name: "Search", path: "/search", zh: "寻" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 md:w-32 lg:w-48 flex flex-col justify-between py-12 items-center border-r border-stone-200/60 z-50 bg-background/50 backdrop-blur-sm hidden md:flex">
      {/* Brand / Logo removed */}
      <div />

      {/* Navigation - Bamboo Joint Style Reimagined for Visibility */}
      <nav className="flex flex-col gap-10 items-center flex-1 justify-center">
        {navItems.map((item) => {
          const isActive = item.path === '/' 
            ? path === '/' 
            : path.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className="group relative flex flex-col items-center gap-3"
            >
               {/* English Horizontal - Much clearer */}
              <span className={cn(
                  "text-sm uppercase tracking-[0.2em] transition-all duration-300",
                  isActive ? "text-foreground font-bold" : "text-subtle group-hover:text-foreground"
              )}>
                {item.name}
              </span>
              
              {/* Chinese Character Circle (The Joint) */}
              <div className={cn(
                  "w-2 h-2 rounded-full border transition-all duration-500",
                  isActive 
                    ? "bg-foreground border-foreground scale-125" 
                    : "bg-transparent border-subtle group-hover:border-foreground"
              )} />
              
              {/* Vertical line connecting lines (optional visual aid) */}
              {/* To make it look like bamboo, we could add lines between items via parent, but let's keep it simple first */}
            </Link>
          );
        })}
        {/* Decorative line running through */}
        <div className="absolute top-1/2 left-1/2 -ml-px w-px h-64 bg-stone-200 -z-10 -translate-y-1/2" />
      </nav>

      {/* Footer / Copyright */}
      <div className="writing-vertical-rl text-[10px] text-stone-300 tracking-widest opacity-50 select-none">
        © 2026
      </div>
    </aside>
  );
}
