import { useParams } from "react-router-dom";
import { getPostBySlug, Post } from "@/lib/posts";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import EncryptedGate from "@/components/EncryptedGate";
import AlsoOnMyBlog from "@/components/AlsoOnMyBlog";
import GiscusComments, { warmupGiscusResources } from "@/components/GiscusComments";
import TagBadge from "@/components/TagBadge";
import { useState, useEffect, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { decodeSlugFromPath } from "@/lib/postSlug";

export default function PostPage() {
  const params = useParams();
  const slug = decodeSlugFromPath(params["*"]);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);

  const loadPost = useCallback(async () => {
    if (!slug) return;
    
    setLoading(true);
    try {
      const data = await getPostBySlug(slug);
      if (data) {
        setPost(data);
      } else {
        setPost(null);
      }
    } catch (error) {
      console.error("Failed to load post:", error);
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    // Load post when slug changes
    setUnlocked(false);
    warmupGiscusResources();
    void loadPost();
  }, [loadPost]);

  const handleUnlock = useCallback(async (password: string): Promise<boolean> => {
    if (!slug) return false;
    const data = await getPostBySlug(slug, password);
    if (!data || data.locked) {
      return false;
    }
    setPost(data);
    setUnlocked(true);
    return true;
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center mt-20">
        <h1 className="text-2xl font-serif mb-4">404 - Post Not Found</h1>
        <Link to="/" className="text-subtle hover:text-foreground">Go Home</Link>
      </div>
    );
  }

  const isProtected = (post.visibility === "encrypted" || post.visibility === "hidden") && !unlocked;

  return (
    <motion.article 
      key={slug}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ 
        duration: 0.5, 
        ease: [0.23, 1, 0.32, 1] // Custom quintic ease-out for a "ink spreading" feel
      }} 
      className="max-w-5xl mx-auto relative group"
    >
      {/* Paper texture overlay - Extremely Subtle Xuan Paper */}
      <div className="absolute inset-x-[-2.5rem] inset-y-[-2.5rem] bg-white/90 backdrop-blur-[1px] rounded-none -z-10 border border-stone-200/20 hidden md:block overflow-hidden" 
           style={{
             backgroundImage: `url("/assets/paperGrain-128.svg")`
           }}
      />
      
      <header className="mb-12 text-center space-y-4 pt-4">
        
        <h1 className="text-3xl md:text-4xl font-serif font-medium leading-tight">
          {post.title}
        </h1>
        <time className="block text-sm text-subtle font-serif">
            {format(parseISO(post.date), "MMMM d, yyyy")}
        </time>
        <div className="flex justify-center gap-2 mb-6">
            {post.tags.map(tag => (
                <TagBadge key={tag} tag={tag} />
            ))}
        </div>
      </header>

      {isProtected ? (
        <EncryptedGate onUnlock={handleUnlock} />
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
             <MarkdownRenderer content={post.content ?? ""} sourceSlug={post.slug} />
        </motion.div>
      )}

      {!isProtected && post.visibility !== "hidden" && <AlsoOnMyBlog currentPost={post} />}
      {!isProtected && <GiscusComments commentId={post.commentId} slug={post.slug} />}
    </motion.article>
  );
}
