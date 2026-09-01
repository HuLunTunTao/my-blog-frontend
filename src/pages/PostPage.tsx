import { useParams, useNavigate } from "react-router-dom";
import { getPostBySlug, getPostByShortId, Post } from "@/lib/api";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import EncryptedGate from "@/components/EncryptedGate";
import AlsoOnMyBlog from "@/components/AlsoOnMyBlog";
import GiscusComments from "@/components/GiscusComments";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Loader2 } from "lucide-react";
import { decodeSlugFromPath, toShortPostRoute } from "@/lib/postSlug";
import ArticleTableOfContents from "@/components/ArticleTableOfContents";
import { extractTableOfContents } from "@/lib/tableOfContents";
import { isGiscusConfigured } from "@/config/giscus.config";
import ArticleArchive from "@/components/ArticleArchive";
import { applyPageMeta } from "@/lib/pageMeta";

export default function PostPage() {
  const params = useParams();
  const navigate = useNavigate();
  const shortId = params.shortId?.trim();
  const slug = shortId ? "" : decodeSlugFromPath(params["*"]);

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const tableOfContents = useMemo(
    () => extractTableOfContents(post?.content ?? "").filter((item) => item.level >= 2 && item.level <= 4),
    [post?.content],
  );

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
        const isProtectedPost =
          data.visibility === "encrypted" || data.visibility === "hidden";
        applyPageMeta({
          title: data.title,
          description: data.excerpt || data.title,
          canonicalPath: `/p/${data.shortId}`,
          robots: isProtectedPost ? "noindex,nofollow" : "index",
          ogType: "article",
        });
        if (!shortId && slug) {
          navigate(toShortPostRoute(data.shortId), { replace: true });
        }
      }
    } catch (error) {
      console.error("Failed to load post:", error);
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, [shortId, slug, navigate]);

  useEffect(() => {
    setUnlocked(false);
    void loadPost();
  }, [loadPost]);

  useEffect(() => {
    if (!loading) {
      window.dispatchEvent(new Event("blog:spa-ready"));
    }
  }, [loading]);

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
  const articleNavigation = [...tableOfContents];
  if (!isProtected && post.visibility !== "hidden") {
    articleNavigation.push({ id: "also-on-my-blog", text: "Also on My Blog", level: 2, kind: "section" });
  }
  if (!isProtected && (post.commentId || post.slug).trim() && isGiscusConfigured()) {
    articleNavigation.push({ id: "comments", text: "评论区", level: 2, kind: "section" });
  }
  const hasArticleSidebar = !isProtected;
  const archive = {
    excerpt: post.excerpt,
    createdTime: post.createdTime,
    publishedTime: post.date,
    updatedTime: post.updatedTime,
    tags: post.tags,
  };

  return (
    <LazyMotion features={domAnimation}>
      <div className={`mx-auto w-full max-w-7xl ${hasArticleSidebar ? "min-[1180px]:mx-0 min-[1180px]:grid min-[1180px]:w-[calc(100%+4rem)] min-[1180px]:grid-cols-[minmax(0,1fr)_17rem] min-[1180px]:items-start min-[1180px]:gap-12" : ""}`}>
      <m.article
      key={post.slug}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{
        duration: 0.5,
        ease: [0.23, 1, 0.32, 1]
      }}
      className="relative mx-auto w-full min-w-0 max-w-5xl group"
    >
      <div className="paper-texture absolute inset-x-[-2.5rem] inset-y-[-2.5rem] bg-white/90 dark:bg-stone-900/60 rounded-none -z-10 border border-stone-200/20 dark:border-stone-700/30 hidden md:block" />

      <header className="mb-12 text-center space-y-4 pt-4">

        <h1 className="text-3xl md:text-4xl font-serif font-medium leading-tight">
          {post.title}
        </h1>
        {!isProtected && (
          <details className="mx-auto mt-5 max-w-md border-y border-stone-300/60 py-3 text-left min-[1180px]:hidden dark:border-stone-700/60">
            <summary className="cursor-pointer list-none font-sans text-xs tracking-[0.18em] text-stone-500 marker:content-none dark:text-stone-400">
              文章信息
            </summary>
            <div className="mt-5 px-2 pb-2">
              <ArticleArchive archive={archive} />
            </div>
          </details>
        )}
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
      {!isProtected && <ArticleTableOfContents items={articleNavigation} archive={archive} />}
      </div>
    </LazyMotion>
  );
}
