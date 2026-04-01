import { getTimelinePosts, groupPostsByYearMonth, Post } from "@/lib/posts";
import { parseISO, format } from "date-fns";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Github, Twitter, Link as LinkIcon, Loader2 } from "lucide-react";
import TimelineSidebar from "./TimelineSidebar";
import { CnblogsIcon } from "./icons/CnblogsIcon";
import { XiaohongshuIcon } from "./icons/XiaohongshuIcon";
import { useState, useEffect } from "react";
import { siteConfig } from "@/config/site.config";
import { toPostRoute } from "@/lib/postSlug";
import type { ComponentType } from "react";
import { useCachedImage } from "@/hooks/useCachedImage";

type SocialIconProps = { size?: string | number; className?: string };

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } }
};

export default function TimelineView() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeYear, setActiveYear] = useState<string>("");
  const cachedAvatar = useCachedImage(siteConfig.author.avatar);

  const grouped = groupPostsByYearMonth(posts);
  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

  // 加载文章
  useEffect(() => {
    loadPosts();
  }, []);

  // 设置初始年份
  useEffect(() => {
    if (years.length > 0 && !activeYear) {
      setActiveYear(years[0]);
    }
  }, [years, activeYear]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      // 一次性加载所有文章（后端已经做了过滤）
      const newPosts = await getTimelinePosts(1, 1000);
      setPosts(newPosts);
    } catch (error) {
      console.error("Failed to load posts:", error);
    } finally {
      setLoading(false);
    }
  };

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
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [years]);


  return (
    <LazyMotion features={domAnimation}>
      {loading && posts.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
        </div>
      ) : (
        <>
          <TimelineSidebar groups={grouped} activeYear={activeYear} onSelectYear={setActiveYear} />
      
      <m.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-24 relative"
      >
        {/* Hero Section */}
        <m.section variants={item} className="py-16 md:py-24 flex flex-col md:flex-row items-center gap-8 md:gap-16 md:pl-4 border-b border-stone-200/50 pb-24 mb-12">
            <div className="relative shrink-0">
                <div className="w-40 h-40 md:w-56 md:h-56 rounded-full bg-stone-200/50 flex items-center justify-center overflow-hidden border border-stone-300 shadow-inner">
                   {siteConfig.author.avatar ? (
                     <img 
                        src={cachedAvatar} 
                        alt={siteConfig.author.name} 
                        className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-700" 
                        referrerPolicy="no-referrer"
                        loading="eager"
                        decoding="async"
                        fetchPriority="high"
                     />
                   ) : (
                     <span className="text-4xl grayscale opacity-50">👤</span>
                   )}
                </div>
                {/* Decorative circle behind */}
                <div className="absolute inset-0 border border-dashed border-stone-300 rounded-full scale-110 animate-spin-slow opacity-30 pointer-events-none"></div>
            </div>
            
            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
                <h1 className="text-2xl md:text-3xl font-serif font-black text-foreground tracking-tight">
                    {siteConfig.author.name}
                </h1>
                <div className="text-sm md:text-lg text-stone-600 leading-relaxed max-w-md font-sans">
                    <p>{siteConfig.author.bio}</p>
                </div>
                <div className="pt-2">
                    <span className="text-sm font-serif italic text-stone-500 border-t border-stone-200 pt-2 px-4 md:px-0 md:border-t-0 md:border-l md:pl-4 block md:inline-block">
                        "{siteConfig.author.motto}"
                    </span>
                </div>

                {/* Social Links */}
                <div className="flex gap-4 pt-4">
                    {siteConfig.socialLinks.map((link) => {
                        let Icon: ComponentType<SocialIconProps> = LinkIcon;
                        if (link.platform === 'github') Icon = Github;
                        if (link.platform === 'twitter') Icon = Twitter;
                        if (link.platform === 'cnblogs') Icon = CnblogsIcon;
                        if (link.platform === 'xiaohongshu') Icon = XiaohongshuIcon;

                        return (
                            <a 
                                key={link.platform}
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-200/50 rounded-full transition-all duration-300 group"
                                title={link.label}
                            >
                                <Icon size={20} className="group-hover:scale-110 transition-transform" />
                            </a>
                        );
                    })}
                </div>
            </div>
        </m.section>

        {years.map((year) => (
          <div key={year} id={`year-${year}`} className="relative scroll-mt-32">
             {/* Year Marker - Optimized: Ink wash style, muted, serif water mark */}
            <div className="flex items-baseline border-b border-black pb-4 mb-12 relative">
                <span className="text-7xl md:text-8xl font-serif font-bold text-stone-950 absolute -left-2 -top-4 md:-left-4 md:-top-6 -z-10 select-none opacity-[0.1] blur-[0.5px]">
                    {year}
                </span>
                <h2 className="text-3xl font-serif font-bold tracking-tight z-10">{year}</h2>
                <span className="ml-4 text-xs font-sans uppercase tracking-widest text-subtle z-10 self-center translate-y-[2px]">
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
                    <m.div variants={item} key={month} className="space-y-6">
                      <div className="flex items-center gap-4">
                        <h3 className="text-sm font-serif font-bold text-foreground uppercase tracking-widest">
                            {monthName}
                        </h3>
                        <div className="h-px bg-border flex-1" />
                      </div>
                      
                      <div className="space-y-4 pl-2">
                        {monthPosts.map((post) => (
                          <Link key={post.slug} to={toPostRoute(post.slug)} className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/70">
                            <article className="relative py-4 px-6 transition-all duration-300 hover:translate-x-1">
                              {/* Individual Paper Layer */}
                              <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] -z-10 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] rounded-none" 
                                   style={{
                                     backgroundImage: `url("/assets/paperGrain-128.svg")`
                                   }}
                              />

                              <header className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-1">
                                <span
                                    className={cn(
                                        "text-xl font-medium decoration-1 underline-offset-4 group-hover:underline",
                                        post.visibility === 'encrypted' && "font-mono text-base text-neutral-600"
                                    )}
                                >
                                  {post.visibility === 'encrypted' && <span className="mr-2">🔒</span>}
                                  {post.title}
                                </span>
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
                          </Link>
                        ))}
                      </div>
                    </m.div>
                  );
                })}
            </div>
          </div>
        ))}
      </m.div>
    </>
  )}
    </LazyMotion>
  );
}
