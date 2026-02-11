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
                        <h3 className="text-sm font-sans font-bold text-foreground uppercase tracking-widest">
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
