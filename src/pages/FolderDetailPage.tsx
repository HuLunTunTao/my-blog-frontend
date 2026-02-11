import { useParams, Link } from "react-router-dom";
import { getFolderByPath, getAllPostsInFolder, Post, FolderNode } from "@/lib/posts";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { toPostRoute } from "@/lib/postSlug";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.13 } }
};

export default function FolderDetailPage() {
  const { path } = useParams<{ path: string }>();
  const decodedPath = path ? decodeURIComponent(path) : '';
  const [folder, setFolder] = useState<FolderNode | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFolder = useCallback(async () => {
    setLoading(true);
    try {
      const folderData = await getFolderByPath(decodedPath);
      setFolder(folderData || null);
      
      if (folderData) {
        // Load posts in this folder
        const postsResponse = await getAllPostsInFolder(decodedPath, false, 1, 100);
        setPosts(postsResponse.posts);
      }
    } catch (error) {
      console.error("Failed to load folder:", error);
      setFolder(null);
    } finally {
      setLoading(false);
    }
  }, [decodedPath]);

  useEffect(() => {
    void loadFolder();
  }, [loadFolder]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-serif mb-4">文件夹未找到</h1>
        <p className="text-stone-500">该文件夹不存在或已被移除。</p>
        <Link to="/folders" className="text-foreground underline mt-4 inline-block">
          返回文件夹列表
        </Link>
      </div>
    );
  }

  const pathParts = decodedPath.split('/').filter(Boolean);

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-4xl mx-auto space-y-12"
    >
      {/* Breadcrumb */}
      <motion.nav variants={item} className="text-sm text-stone-500 flex items-center gap-2 flex-wrap">
        <Link to="/folders" className="hover:text-foreground transition-colors">
          文件夹
        </Link>
        {pathParts.map((part, index) => {
          const currentPath = pathParts.slice(0, index + 1).join('/');
          const isLast = index === pathParts.length - 1;
          return (
            <span key={currentPath} className="flex items-center gap-2">
              <span>/</span>
              {isLast ? (
                <span className="text-foreground font-medium">{part}</span>
              ) : (
                <Link
                  to={`/folders/${encodeURIComponent(currentPath)}`}
                  className="hover:text-foreground transition-colors"
                >
                  {part}
                </Link>
              )}
            </span>
          );
        })}
      </motion.nav>

      {/* Folder Title */}
      <div className="flex items-baseline gap-4 mb-2">
        <motion.h1
          variants={item}
          className="text-4xl font-serif text-foreground"
        >
          {folder.name}
        </motion.h1>
        <motion.span variants={item} className="text-stone-500 text-lg">
           ({folder.directPostCount ?? 0} / {folder.postCount ?? 0})
        </motion.span>
      </div>

      {/* Folder Description */}
      {folder.description && (
        <motion.div
          variants={item}
          className="prose prose-stone max-w-none bg-stone-50/30 rounded-lg p-6 border border-stone-200/50"
        >
          <MarkdownRenderer content={folder.description} />
        </motion.div>
      )}

      {/* Subfolders */}
      {folder.children.length > 0 && (
        <motion.section
          variants={item}
        >
          <h2 className="text-2xl font-serif mb-6 text-foreground flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            子文件夹
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {folder.children.map((subfolder: FolderNode) => (
              <Link
                key={subfolder.path}
                to={`/folders/${encodeURIComponent(subfolder.path)}`}
                className="group p-4 border border-stone-200/60 rounded-lg hover:border-stone-300 hover:shadow-sm transition-all bg-white/50"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="w-6 h-6 text-stone-400 group-hover:text-foreground transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground group-hover:underline">
                      {subfolder.name}
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {subfolder.directPostCount ?? 0} / {subfolder.postCount ?? 0} 篇文章
                    </p>
                  </div>
                  <svg
                    className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </motion.section>
      )}

      {/* Posts in this folder */}
      {posts.length > 0 && (
        <motion.section
          variants={item}
        >
          <h2 className="text-2xl font-serif mb-6 text-foreground flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            文章列表
          </h2>
          <motion.div 
            className="space-y-4 pl-2"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {posts.map((post) => (
              <motion.article
                key={post.slug}
                variants={item}
                className="group relative py-4 px-6 transition-all duration-300 hover:translate-x-1"
              >
                {/* Paper Layer - Consistent with other pages */}
                <div
                  className="absolute inset-0 bg-white/50 backdrop-blur-[2px] -z-10 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] rounded-none"
                  style={{
                    backgroundImage: `url("/assets/paperGrain-128.svg")`
                  }}
                />

                <header className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-1">
                  <Link
                    to={toPostRoute(post.slug)}
                    className="text-xl font-medium decoration-1 underline-offset-4 hover:underline"
                  >
                    {post.title}
                  </Link>
                  <span className="text-xs text-subtle font-sans mt-1 md:mt-0">
                    {format(parseISO(post.date), 'yyyy-MM-dd')}
                  </span>
                </header>
                {post.excerpt && (
                  <p className="text-neutral-500 font-serif text-sm leading-relaxed line-clamp-2 max-w-lg">
                    {post.excerpt}
                  </p>
                )}
              </motion.article>
            ))}
          </motion.div>
        </motion.section>
      )}

      {/* Empty state */}
      {folder.children.length === 0 && posts.length === 0 && !folder.description && (
        <motion.p variants={item} className="text-stone-500 italic text-center py-12">
          该文件夹暂时没有内容
        </motion.p>
      )}
    </motion.div>
  );
}
