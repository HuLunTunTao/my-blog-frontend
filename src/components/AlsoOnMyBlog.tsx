import { Link } from "react-router-dom";
import { type Post } from "@/lib/posts";
import { getRelatedPostsByTags, getPrevNextPost } from "@/lib/posts";
import { useState, useEffect } from "react";

interface Props {
  currentPost: Post;
}

export default function AlsoOnMyBlog({ currentPost }: Props) {
  const [related, setRelated] = useState<Post[]>([]);
  const [prev, setPrev] = useState<Post | undefined>();
  const [next, setNext] = useState<Post | undefined>();

  useEffect(() => {
    loadRelated();
  }, [currentPost.slug]);

  const loadRelated = async () => {
    try {
      const relatedPosts = await getRelatedPostsByTags(currentPost.slug, currentPost.tags);
      setRelated(relatedPosts);

      const { prev: prevPost, next: nextPost } = await getPrevNextPost(currentPost.slug);
      setPrev(prevPost);
      setNext(nextPost);
    } catch (error) {
      console.error("Failed to load related posts:", error);
    }
  };

  return (
    <div className="mt-24 pt-12 border-t border-border space-y-12">
      {(prev || next) && (
        <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
                {prev && (
                    <Link to={`/posts/${prev.slug}`} className="group block text-right md:text-left">
                        <span className="text-subtle text-xs uppercase tracking-widest block mb-1">Previous</span>
                        <span className="group-hover:underline decoration-1 underline-offset-4 line-clamp-1">
                            {prev.title}
                        </span>
                    </Link>
                )}
            </div>
            <div className="text-right">
                {next && (
                     <Link to={`/posts/${next.slug}`} className="group block">
                        <span className="text-subtle text-xs uppercase tracking-widest block mb-1">Next</span>
                        <span className="group-hover:underline decoration-1 underline-offset-4 line-clamp-1">
                            {next.title}
                        </span>
                    </Link>
                )}
            </div>
        </div>
      )}

      {related.length > 0 && (
        <div>
          <h3 className="text-sm font-sans font-bold text-subtle uppercase tracking-widest mb-6 border-b border-border pb-2 inline-block">
            Also on My Blog
          </h3>
          <ul className="space-y-3">
            {related.map((post) => (
              <li key={post.slug}>
                <Link 
                    to={`/posts/${post.slug}`}
                    className="group flex justify-between items-baseline hover:bg-neutral-50 p-2 -mx-2 rounded transition-colors"
                >
                  <span className="group-hover:underline decoration-1 underline-offset-4">{post.title}</span>
                  <span className="text-xs text-subtle">{post.date}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
