import { useParams, Link } from "react-router-dom";
import { getPostsByTag, getTagIntro } from "@/lib/posts";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";

export default function TagDetailPage() {
  const { tag } = useParams();
  if (!tag) return null;

  const posts = getPostsByTag(tag);
  const intro = getTagIntro(tag);

  return (
    <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="space-y-12"
    >
      <header className="text-center space-y-4">
        <span className="text-xs uppercase tracking-widest text-subtle">Tag</span>
        <h1 className="text-3xl font-serif">#{tag}</h1>
      </header>
    
      {intro && (
        <div className="bg-neutral-50 p-6 rounded-lg text-sm text-subtle italic border border-border">
            <MarkdownRenderer content={intro} />
            <div className="mt-2 text-right text-xs">— Tag Description</div>
        </div>
      )}

      <div className="space-y-8">
        {posts.map((post) => (
          <article key={post.slug} className="group relative py-6 px-8 transition-all duration-300 hover:translate-x-1">
            {/* Individual Paper Layer - Consistent with TimelineView (Straight Corners, Texture) */}
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] -z-10 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] rounded-none" 
                 style={{
                   backgroundImage: `url("/assets/paperGrain-128.svg")`
                 }}
            />
            
            <Link to={`/posts/${post.slug}`} className="block">
                <div className="flex justify-between items-baseline mb-2">
                    <h2 className="text-xl font-medium decoration-1 underline-offset-4 hover:underline tracking-tight transition-colors">
                        {post.title}
                    </h2>
                    <span className="text-xs text-subtle font-sans opacity-70">
                        {format(parseISO(post.date), "yyyy-MM-dd")}
                    </span>
                </div>
                {post.excerpt && (
                    <p className="text-stone-500 font-serif text-sm line-clamp-2 leading-relaxed">{post.excerpt}</p>
                )}
            </Link>
          </article>
        ))}
        {posts.length === 0 && (
            <p className="text-center text-subtle">No posts found with this tag.</p>
        )}
      </div>
    </motion.div>
  );
}
