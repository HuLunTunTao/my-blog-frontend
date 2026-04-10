import { useState } from "react";
import { Link } from "react-router-dom";
import { FolderNode } from "@/lib/posts";
import { cn } from "@/lib/utils";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";

interface FolderTreeItemProps {
  folder: FolderNode;
  level: number;
}

function FolderTreeItem({ folder, level }: FolderTreeItemProps) {
  const [isOpen, setIsOpen] = useState(level === 0);
  const hasChildren = folder.children.length > 0;
  // Fix: Use postCount instead of posts.length, as posts array might be empty (lazy loaded)
  const hasContent = (folder.postCount ?? 0) > 0 || !!folder.description;

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-2 py-1.5 group cursor-pointer",
          level > 0 && "hover:bg-stone-50/50 dark:hover:bg-stone-800/40 px-2 -mx-2"
        )}
        style={{ paddingLeft: `${level * 1}rem` }}
      >
        {/* Expand/Collapse Icon */}
        {hasChildren && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-4 h-4 flex items-center justify-center text-stone-400 dark:text-stone-500 hover:text-foreground transition-colors"
          >
            <svg
              className={cn(
                "w-3 h-3 transition-transform duration-200",
                isOpen && "rotate-90"
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}

        {/* Folder Icon - Unified */}
        <span className="text-stone-400 dark:text-stone-500 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        </span>

        {/* Folder Name */}
        {hasContent && folder.path !== '' ? (
          <Link
            to={`/folders/${encodeURIComponent(folder.path)}`}
            className="flex-1 text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors"
          >
            {folder.name}
            <span className="ml-2 text-xs text-stone-400 dark:text-stone-500">
               ({folder.directPostCount ?? 0} / {folder.postCount ?? 0})
            </span>
          </Link>
        ) : (
          <span className="flex-1 text-sm font-medium text-stone-400 dark:text-stone-500">
            {folder.name}
          </span>
        )}
      </div>

      {/* Children */}
      <AnimatePresence>
        {isOpen && hasChildren && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {folder.children.map((child) => (
              <FolderTreeItem key={child.path} folder={child} level={level + 1} />
            ))}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FolderTreeProps {
  root: FolderNode;
}

export default function FolderTree({ root }: FolderTreeProps) {
  return (
    <LazyMotion features={domAnimation}>
      <div className="space-y-1">
        {root.children.length > 0 ? (
          root.children.map((folder) => (
            <FolderTreeItem key={folder.path} folder={folder} level={0} />
          ))
        ) : (
          <p className="text-sm text-stone-400 dark:text-stone-500 italic">暂无文件夹</p>
        )}
      </div>
    </LazyMotion>
  );
}
