import { useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Link } from "react-router-dom";
import CopyButton from "./CopyButton";
import { getPostBySlug } from "@/lib/api";
import { toPostRoute } from "@/lib/postSlug";
import { siteConfig } from "@/config/site.config";
import {
  decodeObsidianEmbedHref,
  extractObsidianFragment,
  getImageWidthFromTitle,
  isObsidianEmbedHref,
  parseObsidianRef,
  preprocessMarkdown,
} from "@/lib/markdown";

interface MarkdownRendererProps {
  content: string;
  depth?: number;
  sourceSlug?: string;
}

const MAX_EMBED_DEPTH = 5;
const MERMAID_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js";

declare global {
  interface Window {
    mermaid?: {
      initialize: (config: unknown) => void;
      render: (id: string, graphDefinition: string) => Promise<{ svg: string }>;
    };
    __mermaidInitialized?: boolean;
    __mermaidLoaderPromise?: Promise<void>;
  }
}

function ensureMermaidLoaded(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.mermaid) return Promise.resolve();
  if (window.__mermaidLoaderPromise) return window.__mermaidLoaderPromise;

  window.__mermaidLoaderPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = MERMAID_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load mermaid"));
    document.head.appendChild(script);
  });

  return window.__mermaidLoaderPromise;
}

function MermaidBlock({ code }: { code: string }) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const id = useMemo(() => `mermaid-${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        await ensureMermaidLoaded();
        if (!window.mermaid) throw new Error("Mermaid unavailable");
        if (!window.__mermaidInitialized) {
          window.mermaid.initialize({ startOnLoad: false, theme: "neutral" });
          window.__mermaidInitialized = true;
        }
        const rendered = await window.mermaid.render(id, code);
        if (active) setSvg(rendered.svg);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Mermaid render failed");
      }
    })();
    return () => {
      active = false;
    };
  }, [code, id]);

  if (error) {
    return (
      <pre className="bg-stone-100/60 border border-stone-300/60 p-4 overflow-x-auto text-xs">
        <code>{code}</code>
      </pre>
    );
  }

  if (!svg) {
    return <div className="text-xs text-subtle">Mermaid rendering...</div>;
  }

  return <div className="my-6 overflow-x-auto border border-stone-300/60 bg-paper p-4" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function ObsidianEmbed({ reference, depth, sourceSlug }: { reference: string; depth: number; sourceSlug?: string }) {
  const parsedRef = useMemo(() => parseObsidianRef(reference), [reference]);
  const [snippet, setSnippet] = useState<string>("");
  const [title, setTitle] = useState<string>(parsedRef.slug || "嵌入");
  const [resolvedSlug, setResolvedSlug] = useState<string>(parsedRef.slug || sourceSlug || "");
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadReference = useCallback(
    async (pwd?: string) => {
      const targetSlug = parsedRef.slug || sourceSlug;
      if (!targetSlug) {
        setError("无效引用");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const post = await getPostBySlug(targetSlug, pwd);
        setTitle(post.title || targetSlug);
        setResolvedSlug(post.slug || targetSlug);
        if (post.locked || post.visibility === "encrypted") {
          setLocked(Boolean(post.locked));
          if (post.locked) {
            setSnippet("");
            setLoading(false);
            return;
          }
        }

        const rawContent = post.content || "";
        const extracted = extractObsidianFragment(rawContent, parsedRef.fragment);
        setSnippet(extracted || rawContent || "_未找到引用内容_");
        setLocked(false);
      } catch {
        setError("引用内容加载失败");
      } finally {
        setLoading(false);
      }
    },
    [parsedRef.fragment, parsedRef.slug, sourceSlug],
  );

  useEffect(() => {
    void loadReference();
  }, [loadReference]);

  if (depth >= MAX_EMBED_DEPTH) {
    return <span className="text-xs text-subtle">[已达到最大引用深度]</span>;
  }

  if (loading) {
    return <span className="text-xs text-subtle">加载引用中...</span>;
  }

  if (error) {
    return <span className="text-xs text-red-500">{error}</span>;
  }

  if (locked) {
    return (
      <div className="border border-stone-300/70 bg-stone-50/60 p-4 my-3 rounded-sm">
        <p className="text-sm font-serif mb-3">该引用来自加密文章，输入密码后可查看。</p>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void loadReference(password);
          }}
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-stone-300 bg-white/70 px-2 py-1 text-sm"
            placeholder="输入密码"
          />
          <button type="submit" className="px-3 py-1 text-xs border border-stone-400 hover:bg-stone-100">
            解锁引用
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="border-l-2 border-stone-300 pl-4 my-4 bg-stone-50/40 py-3 pr-3">
      <div className="mb-2 text-xs uppercase tracking-widest text-subtle">
        引用自{" "}
        <Link className="underline underline-offset-2" to={toPostRoute(resolvedSlug)}>
          {title}
        </Link>
      </div>
      <MarkdownRenderer content={snippet} depth={depth + 1} sourceSlug={resolvedSlug} />
    </div>
  );
}

function getPlainText(node: unknown): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(getPlainText).join("");
  if (node && typeof node === "object" && "props" in node) {
    const props = (node as { props?: { children?: unknown } }).props;
    return getPlainText(props?.children);
  }
  return "";
}

const CALLOUT_STYLES: Record<string, string> = {
  note: "border-l-blue-400 bg-blue-50/50",
  tip: "border-l-emerald-500 bg-emerald-50/55",
  info: "border-l-cyan-500 bg-cyan-50/55",
  warning: "border-l-amber-500 bg-amber-50/55",
  danger: "border-l-rose-500 bg-rose-50/55",
  quote: "border-l-stone-500 bg-stone-100/70",
  summary: "border-l-indigo-500 bg-indigo-50/55",
  abstract: "border-l-violet-500 bg-violet-50/55",
  example: "border-l-teal-500 bg-teal-50/55",
};

function normalizeAssetSrc(src?: string): string | undefined {
  if (!src) return src;
  if (src.startsWith("/api/")) {
    return `${siteConfig.apiBaseUrl}${src}`;
  }
  return src;
}

export default function MarkdownRenderer({ content, depth = 0, sourceSlug }: MarkdownRendererProps) {
  const processedContent = useMemo(() => preprocessMarkdown(content), [content]);

  const components: Components = {
    code({ className, children }) {
      const match = /language-(\w+)/.exec(className || "");
      const codeText = String(children).replace(/\n$/, "");
      if (match?.[1]?.toLowerCase() === "mermaid") {
        return <MermaidBlock code={codeText} />;
      }
      return match ? (
        <div className="relative group my-10">
          <CopyButton text={codeText} />
          <SyntaxHighlighter
            style={oneLight as any}
            language={match[1]}
            PreTag="div"
            useInlineStyles={true}
            customStyle={{
              background: "#FBFBFA",
              padding: "2rem",
              borderRadius: "0",
              fontSize: "0.875rem",
              border: "1px solid #D6D3D1",
              margin: 0,
            }}
          >
            {codeText}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code className={`${className} bg-neutral-200/60 px-1.5 py-0.5 rounded font-mono text-sm border border-neutral-300/50 text-foreground`}>
          {children}
        </code>
      );
    },
    a({ href, children, ...props }) {
      if (href && isObsidianEmbedHref(href)) {
        return <ObsidianEmbed reference={decodeObsidianEmbedHref(href)} depth={depth} sourceSlug={sourceSlug} />;
      }
      if (href?.startsWith("/")) {
        return (
          <Link to={href} {...props}>
            {children}
          </Link>
        );
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    },
    img({ src, alt, title }) {
      const width = getImageWidthFromTitle(title);
      return (
        <img
          src={normalizeAssetSrc(src)}
          alt={alt || ""}
          loading="lazy"
          style={width ? { width: `${width}px`, maxWidth: "100%" } : { maxWidth: "100%" }}
          className="my-6 border border-stone-300/60 bg-paper"
        />
      );
    },
    blockquote({ children }) {
      const childList = Array.isArray(children) ? children : [children];
      const first = childList[0];
      const firstText = getPlainText(first).trim();
      const match = /^\[!([a-zA-Z]+)\]\s*(.*)$/.exec(firstText);
      if (!match) {
        return <blockquote>{children}</blockquote>;
      }

      const type = match[1].toLowerCase();
      const title = match[2] || type.toUpperCase();
      return (
        <div className={`my-6 border-l-4 px-5 py-4 rounded-r-sm ${CALLOUT_STYLES[type] || CALLOUT_STYLES.note}`}>
          <div className="text-xs uppercase tracking-widest font-sans text-stone-600 mb-2">{title}</div>
          <div className="prose prose-neutral max-w-none">{childList.slice(1)}</div>
        </div>
      );
    },
  };

  return (
    <div
      className="prose prose-neutral max-w-none
      prose-headings:font-serif prose-headings:text-foreground prose-headings:font-bold
      prose-h1:text-4xl prose-h1:font-black prose-h1:tracking-tight prose-h1:mb-8
      prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border
      prose-h3:text-xl prose-h3:font-bold prose-h3:mt-8 prose-h3:mb-4
      prose-p:text-foreground prose-p:leading-relaxed
      prose-code:before:content-none prose-code:after:content-none
      prose-strong:font-black prose-strong:text-foreground prose-strong:bg-neutral-200/50 prose-strong:rounded-sm prose-strong:px-1 prose-strong:mx-0.5 prose-strong:inline-block prose-strong:leading-none prose-strong:py-0.5
      prose-a:text-foreground prose-a:decoration-1 prose-a:underline-offset-4 prose-a:font-bold
      prose-blockquote:border-l-4 prose-blockquote:border-foreground prose-blockquote:bg-stone-200/20 prose-blockquote:py-4 prose-blockquote:px-8 prose-blockquote:rounded-r-lg prose-blockquote:font-kaiti prose-blockquote:italic prose-blockquote:shadow-sm prose-blockquote:text-stone-700
      prose-li:marker:text-stone-400 prose-ul:list-disc prose-ol:list-decimal
      prose-pre:bg-transparent prose-pre:p-0"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
