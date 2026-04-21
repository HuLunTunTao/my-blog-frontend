import { useParams } from "react-router-dom";
import { getPostBySlug, getPostByShortId, Post } from "@/lib/api";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import EncryptedGate from "@/components/EncryptedGate";
import AlsoOnMyBlog from "@/components/AlsoOnMyBlog";
import GiscusComments, { warmupGiscusResources } from "@/components/GiscusComments";
import TagBadge from "@/components/TagBadge";
import { useState, useEffect, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Loader2 } from "lucide-react";
import { decodeSlugFromPath } from "@/lib/postSlug";

function setCanonicalUrl(shortId: string) {
  const url = `/p/${shortId}`;
  let link = document.querySelector<HTMLLinkElement>("link[rel='canonical']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = url;
}

export default function PostPage() {
  const params = useParams();
  const shortId = params.shortId?.trim();
  const slug = shortId ? "" : decodeSlugFromPath(params["*"]);

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);

  const loadPost = useCallback(async () => {
    setLoading(true);
    try {
      let data: Post;
      if (shortId) {
        data = await getPostByShortId(shortId);
      } else if (slug) {
        data = await getPostBySlug(slug);
      } else {
        setPost(null);
        setLoading(false);
        return;
      }
      setPost(data);
      if (data.shortId) {
        setCanonicalUrl(data.shortId);
      }
    } catch (error) {
      console.error("Failed to load post:", error);
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, [shortId, slug]);

  useEffect(() => {
    setUnlocked(false);
    warmupGiscusResources();
    void loadPost();
  }, [loadPost]);

  const handleUnlock = useCallback(async (password: string): Promise<boolean> => {
    try {
      let data: Post;
      if (shortId) {
        data = await getPostByShortId(shortId, password);
      } else if (slug) {
        data = await getPostBySlug(slug, password);
      } else {
        return false;
      }
      if (!data || data.locked) {
        return false;
      }
      setPost(data);
      setUnlocked(true);
      return true;
    } catch {
      return false;
    }
  }, [shortId, slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400 dark:text-stone-500" />
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
    <LazyMotion features={domAnimation}>
      <m.article
      key={post.slug}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{
        duration: 0.5,
        ease: [0.23, 1, 0.32, 1]
      }}
      className="max-w-5xl mx-auto relative group"
    >
      <div className="absolute inset-x-[-2.5rem] inset-y-[-2.5rem] bg-white/90 dark:bg-stone-900/40 backdrop-blur-[1px] rounded-none -z-10 border border-stone-200/20 dark:border-stone-700/30 hidden md:block overflow-hidden"
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
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
             <MarkdownRenderer content={post.content ?? ""} sourceSlug={post.slug} />
        </m.div>
      )}

      {!isProtected && post.visibility !== "hidden" && <AlsoOnMyBlog currentPost={post} />}
      {!isProtected && <GiscusComments commentId={post.commentId} slug={post.slug} />}
      </m.article>
    </LazyMotion>
  );
}
