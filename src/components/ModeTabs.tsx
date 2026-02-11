import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function ModeTabs() {
  const location = useLocation();
  const path = location.pathname;

  const tabs = [
    { name: "Time", path: "/" },
    { name: "Tags", path: "/tags" },
    { name: "Search", path: "/search" },
  ];

  return (
    <nav className="flex justify-center space-x-8 py-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur z-20 w-full max-w-prose mx-auto">
      {tabs.map((tab) => {
        const isActive = 
            tab.path === '/' 
            ? path === '/' 
            : path.startsWith(tab.path);
            
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={cn(
              "text-sm uppercase tracking-widest transition-colors font-sans relative pb-1",
              isActive ? "text-foreground font-semibold" : "text-subtle hover:text-foreground"
            )}
          >
            [ {tab.name} ]
            {isActive && (
                <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
