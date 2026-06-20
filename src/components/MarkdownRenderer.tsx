import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight, oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import "katex/dist/katex.min.css";
import { Link } from "react-router-dom";
import {
  AlertOctagon,
  AlertTriangle,
  Bug,
  CheckCircle2,
  ClipboardList,
  FileText,
  FlaskConical,
  HelpCircle,
  Info,
  Lightbulb,
  ListTodo,
  Quote,
  type LucideIcon,
} from "lucide-react";
import CopyButton from "./CopyButton";
import { getPostBySlug } from "@/lib/api";
import { toPostRoute } from "@/lib/postSlug";
import { buildBackendUrl } from "@/config/backend.config";
import { useTheme } from "@/context/ThemeContext";
import {
  decodeObsidianDetailsHref,
  decodeObsidianEmbedHref,
  extractObsidianFragment,
  getImageWidthFromTitle,
  isObsidianDetailsHref,
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

// Lazily load mermaid (~1.6MB) only when a post actually contains a mermaid block.
let mermaidPromise: Promise<typeof import("mermaid").default> | null = null;
function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((mod) => {
      const mermaid = mod.default;
      mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "loose" });
      return mermaid;
    });
  }
  return mermaidPromise;
}

function MermaidBlock({ code }: { code: string }) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const mermaid = await loadMermaid();
        const rendered = await mermaid.render(idRef.current, code);
        if (active) setSvg(rendered.svg);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Mermaid render failed");
      }
    })();
    return () => {
      active = false;
    };
  }, [code]);

  if (error) {
    return (
      <pre className="bg-stone-100/60 dark:bg-stone-800/60 border border-stone-300/60 dark:border-stone-700/60 p-4 overflow-x-auto text-xs">
        <code>{code}</code>
      </pre>
    );
  }

  if (!svg) {
    return <div className="text-xs text-subtle">Mermaid rendering...</div>;
  }

  return (
    <img
      src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
      alt="Mermaid diagram"
      className="my-6 block max-w-full border border-stone-300/60 dark:border-stone-700/60 bg-paper p-4"
      loading="lazy"
    />
  );
}

type EmbedState = {
  snippet: string;
  title: string;
  resolvedSlug: string;
  loading: boolean;
  locked: boolean;
  password: string;
  error: string | null;
};

type EmbedAction =
  | { type: "start_loading" }
  | { type: "set_error"; error: string }
  | { type: "set_locked"; locked: boolean }
  | { type: "set_loaded"; snippet: string; title: string; resolvedSlug: string }
  | { type: "set_password"; password: string };

function createEmbedInitialState(slug: string): EmbedState {
  return {
    snippet: "",
    title: slug || "嵌入",
    resolvedSlug: slug,
    loading: true,
    locked: false,
    password: "",
    error: null,
  };
}

function embedReducer(state: EmbedState, action: EmbedAction): EmbedState {
  switch (action.type) {
    case "start_loading":
      return { ...state, loading: true, error: null };
    case "set_error":
      return { ...state, loading: false, error: action.error };
    case "set_locked":
      return { ...state, loading: false, locked: action.locked, snippet: action.locked ? "" : state.snippet };
    case "set_loaded":
      return {
        ...state,
        snippet: action.snippet,
        title: action.title,
        resolvedSlug: action.resolvedSlug,
        loading: false,
        locked: false,
        error: null,
      };
    case "set_password":
      return { ...state, password: action.password };
    default:
      return state;
  }
}

function ObsidianEmbed({ reference, depth, sourceSlug }: { reference: string; depth: number; sourceSlug?: string }) {
  const parsedRef = useMemo(() => parseObsidianRef(reference), [reference]);
  const [state, dispatch] = useReducer(embedReducer, parsedRef.slug || sourceSlug || "", createEmbedInitialState);

  const loadReference = useCallback(
    async (pwd?: string) => {
      const targetSlug = parsedRef.slug || sourceSlug;
      if (!targetSlug) {
        dispatch({ type: "set_error", error: "无效引用" });
        return;
      }
      dispatch({ type: "start_loading" });
      try {
        const post = await getPostBySlug(targetSlug, pwd);
        if (!post) {
          dispatch({ type: "set_error", error: "引用内容加载失败" });
          return;
        }
        const nextTitle = post?.title || targetSlug;
        const nextSlug = post?.slug || targetSlug;
        if (post.locked || post.visibility === "encrypted" || post.visibility === "hidden") {
          if (post.locked) {
            dispatch({ type: "set_locked", locked: true });
            return;
          }
        }

        const rawContent = post.content || "";
        const extracted = extractObsidianFragment(rawContent, parsedRef.fragment);
        dispatch({
          type: "set_loaded",
          snippet: extracted || rawContent || "_未找到引用内容_",
          title: nextTitle,
          resolvedSlug: nextSlug,
        });
      } catch {
        dispatch({ type: "set_error", error: "引用内容加载失败" });
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

  if (state.loading) {
    return <span className="text-xs text-subtle">加载引用中...</span>;
  }

  if (state.error) {
    return <span className="text-xs text-red-500">{state.error}</span>;
  }

  if (state.locked) {
    return (
      <div className="border border-stone-300/70 dark:border-stone-700/70 bg-stone-50/60 dark:bg-stone-900/50 p-4 my-3 rounded-sm">
        <p className="text-sm font-serif mb-3">该引用来自加密文章，输入密码后可查看。</p>
        <div className="flex items-center gap-2">
          <input
            type="password"
            value={state.password}
            onChange={(e) => dispatch({ type: "set_password", password: e.target.value })}
            className="border border-stone-300 dark:border-stone-700 bg-white/70 dark:bg-stone-800/70 text-foreground px-2 py-1 text-sm"
            placeholder="输入密码"
          />
          <button type="button" onClick={() => void loadReference(state.password)} className="px-3 py-1 text-xs border border-stone-400 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800">
            解锁引用
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-l-2 border-stone-300 dark:border-stone-700 pl-4 my-4 bg-stone-50/40 dark:bg-stone-900/40 py-3 pr-3">
      <div className="mb-2 text-xs uppercase tracking-widest text-subtle">
        引用自{" "}
        <Link className="underline underline-offset-2" to={toPostRoute(state.resolvedSlug)}>
          {state.title}
        </Link>
      </div>
      <MarkdownRenderer content={state.snippet} depth={depth + 1} sourceSlug={state.resolvedSlug} />
    </div>
  );
}

function ObsidianDetails({ href, depth, sourceSlug }: { href: string; depth: number; sourceSlug?: string }) {
  const details = useMemo(() => decodeObsidianDetailsHref(href), [href]);
  if (!details) {
    return <span className="text-xs text-red-500">折叠内容解析失败</span>;
  }
  return (
    <details className="my-6 rounded-sm border border-stone-300/70 dark:border-stone-700/70 bg-stone-50/40 dark:bg-stone-900/40 px-4 py-3">
      <summary className="cursor-pointer select-none text-sm font-semibold tracking-wide text-foreground">{details.summary}</summary>
      <div className="mt-3">
        <MarkdownRenderer content={details.body} depth={depth + 1} sourceSlug={sourceSlug} />
      </div>
    </details>
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
  note:     "border-l-blue-400 bg-blue-50/50 dark:bg-blue-950/30",
  tip:      "border-l-emerald-500 bg-emerald-50/55 dark:bg-emerald-950/30",
  info:     "border-l-cyan-500 bg-cyan-50/55 dark:bg-cyan-950/30",
  success:  "border-l-lime-500 bg-lime-50/60 dark:bg-lime-950/30",
  question: "border-l-sky-500 bg-sky-50/60 dark:bg-sky-950/30",
  warning:  "border-l-amber-500 bg-amber-50/55 dark:bg-amber-950/30",
  failure:  "border-l-orange-500 bg-orange-50/60 dark:bg-orange-950/30",
  danger:   "border-l-rose-500 bg-rose-50/55 dark:bg-rose-950/30",
  bug:      "border-l-red-500 bg-red-50/60 dark:bg-red-950/30",
  quote:    "border-l-stone-500 bg-stone-100/70 dark:bg-stone-800/50",
  summary:  "border-l-indigo-500 bg-indigo-50/55 dark:bg-indigo-950/30",
  abstract: "border-l-violet-500 bg-violet-50/55 dark:bg-violet-950/30",
  example:  "border-l-teal-500 bg-teal-50/55 dark:bg-teal-950/30",
  todo:     "border-l-fuchsia-500 bg-fuchsia-50/60 dark:bg-fuchsia-950/30",
};

const CALLOUT_META: Record<string, { icon: LucideIcon; titleClassName: string }> = {
  note:     { icon: FileText,     titleClassName: "text-blue-700 dark:text-blue-300" },
  tip:      { icon: Lightbulb,    titleClassName: "text-emerald-700 dark:text-emerald-300" },
  info:     { icon: Info,         titleClassName: "text-cyan-700 dark:text-cyan-300" },
  success:  { icon: CheckCircle2, titleClassName: "text-lime-700 dark:text-lime-300" },
  question: { icon: HelpCircle,   titleClassName: "text-sky-700 dark:text-sky-300" },
  warning:  { icon: AlertTriangle,titleClassName: "text-amber-700 dark:text-amber-300" },
  failure:  { icon: AlertTriangle,titleClassName: "text-orange-700 dark:text-orange-300" },
  danger:   { icon: AlertOctagon, titleClassName: "text-rose-700 dark:text-rose-300" },
  bug:      { icon: Bug,          titleClassName: "text-red-700 dark:text-red-300" },
  quote:    { icon: Quote,        titleClassName: "text-stone-700 dark:text-stone-300" },
  summary:  { icon: ClipboardList,titleClassName: "text-indigo-700 dark:text-indigo-300" },
  abstract: { icon: ClipboardList,titleClassName: "text-violet-700 dark:text-violet-300" },
  example:  { icon: FlaskConical, titleClassName: "text-teal-700 dark:text-teal-300" },
  todo:     { icon: ListTodo,     titleClassName: "text-fuchsia-700 dark:text-fuchsia-300" },
};

const CALLOUT_TYPE_ALIASES: Record<string, string> = {
  abstract: "summary",
  tldr: "summary",
  hint: "tip",
  important: "tip",
  check: "success",
  done: "success",
  help: "question",
  faq: "question",
  caution: "warning",
  attention: "warning",
  fail: "failure",
  missing: "failure",
  error: "danger",
  cite: "quote",
};

function resolveCalloutType(rawType: string): string {
  const normalized = rawType.toLowerCase();
  return CALLOUT_TYPE_ALIASES[normalized] || normalized;
}

function calloutDefaultTitle(type: string): string {
  return type.slice(0, 1).toUpperCase() + type.slice(1);
}

function CalloutTitle({ type, title }: { type: string; title: string }) {
  const meta = CALLOUT_META[type] || CALLOUT_META.note;
  const Icon = meta.icon;
  return (
    <div className={`mb-2 flex items-center gap-2 text-sm tracking-wide font-sans font-semibold ${meta.titleClassName}`}>
      <Icon size={18} strokeWidth={2.2} aria-hidden="true" />
      <span>{title}</span>
    </div>
  );
}

function SoftBreakText({ text }: { text: string }) {
  const lines = text.split("\n");
  let cursor = 0;
  return (
    <>
      {lines.map((line) => {
        const key = `${cursor}-${line.length}`;
        cursor += line.length + 1;
        return (
          <p key={key} className="my-0">
            {line}
          </p>
        );
      })}
    </>
  );
}

function normalizeAssetSrc(src?: string): string | undefined {
  if (!src) return src;
  if (src.startsWith("/api/")) {
    return buildBackendUrl(src);
  }
  return src;
}

function encodeAssetPath(path: string): string {
  return path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function extractApiAssetPath(src?: string): string | null {
  if (!src) return null;
  const marker = "/api/assets/";
  const idx = src.indexOf(marker);
  if (idx === -1) return null;
  const raw = src.slice(idx + marker.length).replace(/^\/+/, "");
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function joinPath(base: string, leaf: string): string {
  if (!base) return leaf;
  return `${base.replace(/\/+$/, "")}/${leaf.replace(/^\/+/, "")}`;
}

function sourceDirFromSlug(sourceSlug?: string): string {
  if (!sourceSlug) return "";
  const parts = sourceSlug.split("/").filter(Boolean);
  if (parts.length <= 1) return "";
  parts.pop();
  return parts.join("/");
}

function buildObsidianAssetCandidates(src?: string, sourceSlug?: string): string[] {
  const normalized = normalizeAssetSrc(src);
  if (!normalized) return [];

  const assetPath = extractApiAssetPath(normalized);
  if (!assetPath) return [normalized];

  const paths = new Set<string>();

  const fileName = assetPath.split("/").filter(Boolean).pop() || "";
  const sourceDir = sourceDirFromSlug(sourceSlug);
  if (fileName) {
    // For nested posts, post-local directory is the most likely location.
    if (sourceDir) {
      paths.add(joinPath(sourceDir, fileName));
      paths.add(joinPath(joinPath(sourceDir, "附件"), fileName));
      paths.add(joinPath(joinPath(sourceDir, "attachment"), fileName));
    }
    // Bare path as fallback (correct for root-level posts, useful for hand-written paths).
    paths.add(assetPath);
    // Common default attachment folders in many vaults.
    paths.add(joinPath("附件", fileName));
    paths.add(joinPath("attachment", fileName));
  } else {
    paths.add(assetPath);
  }

  return Array.from(paths).map((p) => buildBackendUrl(`/api/assets/${encodeAssetPath(p)}`));
}

function ResilientImage({ src, alt, title, sourceSlug }: { src?: string; alt?: string; title?: string; sourceSlug?: string }) {
  const width = getImageWidthFromTitle(title);
  const candidates = useMemo(() => buildObsidianAssetCandidates(src, sourceSlug), [src, sourceSlug]);
  const [candidateIndex, setCandidateIndex] = useState(0);

  return (
    <img
      src={candidates[candidateIndex]}
      alt={alt || ""}
      loading="lazy"
      style={width ? { width: `${width}px`, maxWidth: "100%" } : { maxWidth: "100%" }}
      className="my-6 border border-stone-300/60 dark:border-stone-700/60 bg-paper"
      onError={() => {
        setCandidateIndex((curr) => (curr + 1 < candidates.length ? curr + 1 : curr));
      }}
    />
  );
}

export default function MarkdownRenderer({ content, depth = 0, sourceSlug }: MarkdownRendererProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const processedContent = useMemo(() => preprocessMarkdown(content), [content]);
  const urlTransform = useCallback((url: string) => {
    if (url.startsWith("obsidian-embed://") || url.startsWith("obsidian-details://")) {
      return url;
    }
    return defaultUrlTransform(url);
  }, []);

  const codeBlockStyle = useMemo(
    () => ({
      background: isDark ? "#1c1b19" : "#FBFBFA",
      padding: "2rem",
      borderRadius: "0",
      fontSize: "0.875rem",
      border: isDark ? "1px solid #3a3733" : "1px solid #D6D3D1",
      margin: 0,
    }),
    [isDark]
  );
  const syntaxTheme = isDark ? oneDark : oneLight;

  const components: Components = useMemo(() => ({
    code({ className, children, node, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const codeText = String(children).replace(/\n$/, "");
      const isInline = (node?.position?.start.line ?? 0) === (node?.position?.end.line ?? 0) && !codeText.includes("\n");
      if (match?.[1]?.toLowerCase() === "mermaid") {
        return <MermaidBlock code={codeText} />;
      }
      return match ? (
        <div className="relative group my-10">
          <CopyButton text={codeText} />
          <SyntaxHighlighter
            style={syntaxTheme}
            language={match[1]}
            PreTag="div"
            useInlineStyles={true}
            customStyle={codeBlockStyle}
          >
            {codeText}
          </SyntaxHighlighter>
        </div>
      ) : (
        isInline ? (
          <code className={`${className} bg-neutral-200/60 dark:bg-stone-800/80 px-1.5 py-0.5 rounded font-mono text-sm border border-neutral-300/50 dark:border-stone-700/60 text-foreground`} {...props}>
            {children}
          </code>
        ) : (
          <div className="relative group my-10">
            <CopyButton text={codeText} />
            <SyntaxHighlighter
              style={syntaxTheme}
              language="text"
              PreTag="div"
              useInlineStyles={true}
              customStyle={codeBlockStyle}
            >
              {codeText}
            </SyntaxHighlighter>
          </div>
        )
      );
    },
    a({ href, children, ...props }) {
      if (href && isObsidianEmbedHref(href)) {
        return <ObsidianEmbed reference={decodeObsidianEmbedHref(href)} depth={depth} sourceSlug={sourceSlug} />;
      }
      if (href && isObsidianDetailsHref(href)) {
        return <ObsidianDetails href={href} depth={depth} sourceSlug={sourceSlug} />;
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
      return <ResilientImage key={`${src ?? ""}::${sourceSlug ?? ""}`} src={src} alt={alt} title={title} sourceSlug={sourceSlug} />;
    },
    blockquote({ children }) {
      const childList = (Array.isArray(children) ? children : [children]).filter(
        (child) => !(typeof child === "string" && child.trim() === ""),
      );
      const first = childList[0];
      const firstText = getPlainText(first).trim();
      const [firstLine, ...restLines] = firstText.split("\n");
      const match = /^\[!([a-zA-Z0-9_-]+)\]([+-])?\s*(.*)$/.exec((firstLine || "").trim());
      if (!match) {
        return (
          <blockquote className="my-6 border-l-[6px] border-stone-300/90 dark:border-stone-600/80 bg-background/50 px-5 py-4 rounded-r-sm text-stone-600 dark:text-stone-300 before:content-none after:content-none [&>p]:my-4 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0 [&>p]:whitespace-pre-line [&>p:first-of-type]:before:content-none [&>p:last-of-type]:after:content-none [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_li_p]:my-0 [&_strong]:font-semibold">

            {children}
          </blockquote>
        );
      }

      const type = resolveCalloutType(match[1]);
      const foldMarker = match[2] as "+" | "-" | undefined;
      const title = (match[3] || "").trim() || calloutDefaultTitle(type);
      const inlineBody = restLines.join("\n").trim();
      const body = (
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          {inlineBody ? <SoftBreakText text={inlineBody} /> : null}
          {childList.slice(1)}
        </div>
      );

      if (foldMarker) {
        return (
          <details open={foldMarker === "+"} className={`my-6 border-l-4 px-5 py-4 rounded-r-sm ${CALLOUT_STYLES[type] || CALLOUT_STYLES.note}`}>
            <summary className="mb-2 cursor-pointer select-none marker:content-none">
              <CalloutTitle type={type} title={title} />
            </summary>
            {body}
          </details>
        );
      }

      return (
        <div className={`my-6 border-l-4 px-5 py-4 rounded-r-sm ${CALLOUT_STYLES[type] || CALLOUT_STYLES.note}`}>
          <CalloutTitle type={type} title={title} />
          {body}
        </div>
      );
    },
  }), [syntaxTheme, codeBlockStyle, depth, sourceSlug]);

  return (
    <div
      className="prose prose-neutral dark:prose-invert max-w-none
      prose-headings:font-serif prose-headings:text-foreground prose-headings:font-bold
      prose-h1:text-4xl prose-h1:font-black prose-h1:tracking-tight prose-h1:mb-8
      prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border
      prose-h3:text-xl prose-h3:font-bold prose-h3:mt-8 prose-h3:mb-4
      prose-p:text-foreground prose-p:leading-relaxed
      prose-code:before:content-none prose-code:after:content-none
      prose-strong:font-black prose-strong:text-foreground
      prose-a:text-foreground prose-a:decoration-1 prose-a:underline-offset-4 prose-a:font-bold
      prose-blockquote:border-l-[6px] prose-blockquote:border-stone-300/90 dark:prose-blockquote:border-stone-600/80 prose-blockquote:bg-background/50 prose-blockquote:py-4 prose-blockquote:px-5 prose-blockquote:rounded-r-sm prose-blockquote:font-sans prose-blockquote:not-italic prose-blockquote:shadow-none prose-blockquote:text-stone-600 dark:prose-blockquote:text-stone-300 prose-blockquote:before:content-none prose-blockquote:after:content-none [&_blockquote_p]:whitespace-pre-line [&_blockquote_p:first-of-type]:before:content-none [&_blockquote_p:last-of-type]:after:content-none [&_blockquote_ul]:my-2 [&_blockquote_ol]:my-2 [&_blockquote_li]:my-1 [&_blockquote_li_p]:my-0 [&_blockquote_strong]:font-semibold
      prose-li:marker:text-stone-400 dark:prose-li:marker:text-stone-500 prose-ul:list-disc prose-ol:list-decimal
      prose-pre:bg-transparent prose-pre:p-0"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
        urlTransform={urlTransform}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
