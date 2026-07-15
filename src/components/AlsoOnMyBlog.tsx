import { Link } from "react-router-dom";
import { type Post } from "@/lib/posts";
import { getNearbyPostsByDate, getRelatedPostsByTags } from "@/lib/posts";
import { useState, useEffect, useCallback } from "react";
import { toPostRoute } from "@/lib/postSlug";

interface Props {
  currentPost: Post;
}

export default function AlsoOnMyBlog({ currentPost }: Props) {
  const [tagRelated, setTagRelated] = useState<Post[]>([]);
  const [nearby, setNearby] = useState<Post[]>([]);

  const loadRelated = useCallback(async () => {
    try {
      const [relatedPosts, nearbyPosts] = await Promise.all([
        getRelatedPostsByTags(currentPost.slug, currentPost.tags),
        getNearbyPostsByDate(currentPost.slug, currentPost.date),
      ]);
      setTagRelated(relatedPosts);

      // 去重，避免同一篇同时出现在两个区块
      const relatedSet = new Set(relatedPosts.map((p) => p.slug));
      setNearby(nearbyPosts.filter((p) => !relatedSet.has(p.slug)));
    } catch (error) {
      console.error("Failed to load related posts:", error);
    }
  }, [currentPost.slug, currentPost.tags, currentPost.date]);

  useEffect(() => {
    void loadRelated();
  }, [loadRelated]);

  return (
    <div className="mt-24 pt-12 border-t border-border space-y-12">
      {(tagRelated.length > 0 || nearby.length > 0) && (
        <div>
          <h2 className="text-sm font-sans font-bold text-subtle uppercase tracking-widest mb-6 border-b border-border pb-2 inline-block">
            Also on My Blog
          </h2>
          {tagRelated.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs uppercase tracking-widest text-subtle mb-3">Same tags</h3>
              <ul className="themed-scrollbar flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
                {tagRelated.map((post) => (
                  <li key={`tag-${post.slug}`} className="min-w-[260px] max-w-[320px] snap-start shrink-0">
                    <Link
                      to={toPostRoute(post)}
                      className="group block border border-stone-200/70 dark:border-stone-700/60 bg-white/60 dark:bg-stone-900/40 p-4 h-full hover:bg-neutral-50 dark:hover:bg-stone-800/50 transition-colors"
                    >
                      <div className="flex justify-between items-baseline gap-3 mb-2">
                        <span className="group-hover:underline decoration-1 underline-offset-4 line-clamp-2">{post.title}</span>
                        <span className="text-xs text-subtle shrink-0">{post.date}</span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-3">
                        {post.excerpt || "暂无简述"}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {nearby.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-widest text-subtle mb-3">Nearby in time</h3>
              <ul className="themed-scrollbar flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
                {nearby.map((post) => (
                  <li key={`near-${post.slug}`} className="min-w-[260px] max-w-[320px] snap-start shrink-0">
                    <Link
                      to={toPostRoute(post)}
                      className="group block border border-stone-200/70 dark:border-stone-700/60 bg-white/60 dark:bg-stone-900/40 p-4 h-full hover:bg-neutral-50 dark:hover:bg-stone-800/50 transition-colors"
                    >
                      <div className="flex justify-between items-baseline gap-3 mb-2">
                        <span className="group-hover:underline decoration-1 underline-offset-4 line-clamp-2">{post.title}</span>
                        <span className="text-xs text-subtle shrink-0">{post.date}</span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-3">
                        {post.excerpt || "暂无简述"}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
