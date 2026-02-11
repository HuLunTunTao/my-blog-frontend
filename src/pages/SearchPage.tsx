import { useSearchParams, Link } from "react-router-dom";
import { searchPosts } from "@/lib/posts";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const results = query ? searchPosts(query) : [];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      setSearchParams({ q: value }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  // Helper to highlight text
  const Highlight = ({ text }: { text: string }) => {
      if (!query) return <>{text}</>;
      const parts = text.split(new RegExp(`(${query})`, 'gi'));
      return (
          <>
            {parts.map((part, i) => 
                part.toLowerCase() === query.toLowerCase() 
                ? <mark key={i} className="bg-yellow-200 rounded-sm px-0.5">{part}</mark> 
                : part
            )}
          </>
      );
  };

  return (
    <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="space-y-8"
    >
      <div className="sticky top-16 bg-background pt-4 pb-4 z-10">
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            placeholder="Search posts..."
            autoFocus
            className="w-full text-2xl font-serif border-b-2 border-border focus:border-black outline-none py-2 bg-transparent placeholder:text-neutral-300 transition-colors"
          />
      </div>

      <div className="space-y-8">
        {query && results.length === 0 && (
            <p className="text-subtle text-center py-12">No results found for "{query}".</p>
        )}
        
        {results.map((post) => (
          <article key={post.slug} className="group pb-8 border-b border-dashed border-border last:border-0">
             <Link to={`/posts/${post.slug}`} className="block space-y-2">
                <div className="flex justify-between items-baseline">
                    <h2 className="text-xl font-medium group-hover:underline decoration-1 underline-offset-4">
                        <Highlight text={post.title} />
                    </h2>
                    <span className="text-xs text-subtle font-sans">
                        {format(parseISO(post.date), "yyyy-MM-dd")}
                    </span>
                </div>
                <div className="flex gap-2">
                    {post.tags.map(t => (
                        <span key={t} className="text-xs text-subtle bg-neutral-100 px-1.5 rounded">
                           <Highlight text={`#${t}`} />
                        </span>
                    ))}
                </div>
                {post.excerpt && (
                    <p className="text-subtle text-sm line-clamp-2">
                        <Highlight text={post.excerpt} />
                    </p>
                )}
            </Link>
          </article>
        ))}
      </div>
    </motion.div>
  );
}
