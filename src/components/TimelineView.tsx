import { getTimelinePosts, groupPostsByYearMonth } from "@/lib/posts";
import { parseISO, format } from "date-fns";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import TimelineSidebar from "./TimelineSidebar";
import { useState, useEffect } from "react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function TimelineView() {
  const posts = getTimelinePosts();
  const grouped = groupPostsByYearMonth(posts);
  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));
  
  const [activeYear, setActiveYear] = useState(years[0]);

  // Simple scroll spy-like effect for active year (optional refinement)
  useEffect(() => {
    const handleScroll = () => {
        // Find which year is closest to top
        for (const year of years) {
            const el = document.getElementById(`year-${year}`);
            if (el) {
                const rect = el.getBoundingClientRect();
                if (rect.top >= 0 && rect.top < 300) {
                    setActiveYear(year);
                    break; 
                }
            }
        }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [years]);


  return (
    <>
      <TimelineSidebar groups={grouped} activeYear={activeYear} onSelectYear={setActiveYear} />
      
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-24 relative"
      >
        {/* Hero Section */}
        <motion.section variants={item} className="py-16 md:py-24 flex flex-col md:flex-row items-center gap-8 md:gap-12 md:pl-4 border-b border-stone-200/50 pb-24 mb-12">
            <div className="relative shrink-0">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-stone-200/50 flex items-center justify-center overflow-hidden border border-stone-300">
                   {/* Replace with your image */}
                   <span className="text-4xl grayscale opacity-50">👤</span>
                </div>
                {/* Decorative circle behind */}
                <div className="absolute inset-0 border border-dashed border-stone-300 rounded-full scale-125 animate-spin-slow opacity-30 pointer-events-none"></div>
            </div>
            
            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground tracking-tight">
                    Author Name
                </h1>
                <div className="text-sm md:text-base text-stone-500 leading-relaxed max-w-md font-sans">
                    <p>Developer & Designer. Writing about code, art, and life.</p>
                </div>
                <div className="pt-2">
                    <span className="text-xs font-serif italic text-stone-400 border-t border-stone-200 pt-2 px-2 md:px-0 md:border-t-0 md:border-l md:pl-3 block md:inline-block">
                        "Nulla dies sine linea."
                    </span>
                </div>
            </div>
        </motion.section>

        {years.map((year) => (
          <div key={year} id={`year-${year}`} className="relative scroll-mt-32">
             {/* Year Marker - More prominent now */}
            <div className="flex items-baseline border-b border-black pb-4 mb-12">
                <span className="text-6xl md:text-8xl font-black text-neutral-100 absolute -left-4 -top-8 md:-left-12 md:-top-16 -z-10 select-none">
                    {year}
                </span>
                <h2 className="text-3xl font-serif font-bold tracking-tight">{year}</h2>
                <span className="ml-4 text-xs font-sans uppercase tracking-widest text-subtle">
                    Archive
                </span>
            </div>
          
            <div className="space-y-16">
              {Object.keys(grouped[year])
                .sort((a, b) => Number(b) - Number(a))
                .map((month) => {
                  const monthPosts = grouped[year][month];
                  const monthName = format(parseISO(`${year}-${month}-01`), "MMMM");

                  return (
                    <motion.div variants={item} key={month} className="space-y-6">
                      <div className="flex items-center gap-4">
                        <h3 className="text-sm font-serif font-bold text-foreground uppercase tracking-widest">
                            {monthName}
                        </h3>
                        <div className="h-px bg-border flex-1" />
                      </div>
                      
                      <div className="space-y-10 pl-2">
                        {monthPosts.map((post) => (
                          <article key={post.slug} className="group relative pl-4 border-l border-neutral-200 hover:border-black transition-colors duration-300">
                            <header className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-2">
                              <Link 
                                  to={`/posts/${post.slug}`}
                                  className={cn(
                                      "text-xl font-medium decoration-1 underline-offset-4 hover:underline",
                                      post.visibility === 'encrypted' && "font-mono text-base text-neutral-600"
                                  )}
                              >
                                {post.visibility === 'encrypted' && <span className="mr-2">🔒</span>}
                                {post.title}
                              </Link>
                              <span className="text-xs text-subtle font-sans mt-1 md:mt-0">
                                {format(parseISO(post.date), "dd")}
                              </span>
                            </header>
                            {post.excerpt && (
                              <p className="text-neutral-500 font-serif text-sm leading-relaxed line-clamp-2 max-w-lg">
                                  {post.visibility === 'encrypted' ? "********" : post.excerpt}
                              </p>
                            )}
                          </article>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </div>
        ))}
      </motion.div>
    </>
  );
}
