import { useParams, useNavigate } from "react-router-dom";
import { getPostBySlug } from "@/lib/posts";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import EncryptedGate from "@/components/EncryptedGate";
import AlsoOnMyBlog from "@/components/AlsoOnMyBlog";
import TagBadge from "@/components/TagBadge";
import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function PostPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const post = getPostBySlug(slug || "");
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    // Reset unlock state when slug changes
    setUnlocked(false);
  }, [slug]);

  if (!post) {
    return (
      <div className="text-center mt-20">
        <h1 className="text-2xl font-serif mb-4">404 - Post Not Found</h1>
        <Link to="/" className="text-subtle hover:text-foreground">Go Home</Link>
      </div>
    );
  }

  const isEncrypted = post.visibility === "encrypted" && !unlocked;

  return (
    <motion.article 
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} // smooth, powerful ease
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

      {isEncrypted ? (
        <EncryptedGate post={post} onUnlock={() => setUnlocked(true)} />
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
        >
             <MarkdownRenderer content={post.content} />
        </motion.div>
      )}

      {!isEncrypted && <AlsoOnMyBlog currentPost={post} />}
    </motion.article>
  );
}
