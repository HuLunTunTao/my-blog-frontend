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
          <article key={post.slug} className="group border-b border-dashed border-border pb-8 last:border-0">
            <Link to={`/posts/${post.slug}`} className="block space-y-2">
                <div className="flex justify-between items-baseline">
                    <h2 className="text-xl font-medium group-hover:underline decoration-1 underline-offset-4">
                        {post.title}
                    </h2>
                    <span className="text-xs text-subtle font-sans">
                        {format(parseISO(post.date), "yyyy-MM-dd")}
                    </span>
                </div>
                {post.excerpt && (
                    <p className="text-subtle text-sm line-clamp-2">{post.excerpt}</p>
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
