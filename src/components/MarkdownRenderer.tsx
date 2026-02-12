import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import mermaid from "mermaid";
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
let mermaidInitialized = false;

function MermaidBlock({ code }: { code: string }) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const id = useMemo(() => `mermaid-${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        if (!mermaidInitialized) {
          mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "loose" });
          mermaidInitialized = true;
        }
        const rendered = await mermaid.render(id, code);
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

function ObsidianDetails({ href, depth, sourceSlug }: { href: string; depth: number; sourceSlug?: string }) {
  const details = useMemo(() => decodeObsidianDetailsHref(href), [href]);
  if (!details) {
    return <span className="text-xs text-red-500">折叠内容解析失败</span>;
  }
  return (
    <details className="my-6 rounded-sm border border-stone-300/70 bg-stone-50/40 px-4 py-3">
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
  note: "border-l-blue-400 bg-blue-50/50",
  tip: "border-l-emerald-500 bg-emerald-50/55",
  info: "border-l-cyan-500 bg-cyan-50/55",
  success: "border-l-lime-500 bg-lime-50/60",
  question: "border-l-sky-500 bg-sky-50/60",
  warning: "border-l-amber-500 bg-amber-50/55",
  failure: "border-l-orange-500 bg-orange-50/60",
  danger: "border-l-rose-500 bg-rose-50/55",
  bug: "border-l-red-500 bg-red-50/60",
  quote: "border-l-stone-500 bg-stone-100/70",
  summary: "border-l-indigo-500 bg-indigo-50/55",
  abstract: "border-l-violet-500 bg-violet-50/55",
  example: "border-l-teal-500 bg-teal-50/55",
  todo: "border-l-fuchsia-500 bg-fuchsia-50/60",
};

const CALLOUT_META: Record<string, { icon: LucideIcon; titleClassName: string }> = {
  note: { icon: FileText, titleClassName: "text-blue-700" },
  tip: { icon: Lightbulb, titleClassName: "text-emerald-700" },
  info: { icon: Info, titleClassName: "text-cyan-700" },
  success: { icon: CheckCircle2, titleClassName: "text-lime-700" },
  question: { icon: HelpCircle, titleClassName: "text-sky-700" },
  warning: { icon: AlertTriangle, titleClassName: "text-amber-700" },
  failure: { icon: AlertTriangle, titleClassName: "text-orange-700" },
  danger: { icon: AlertOctagon, titleClassName: "text-rose-700" },
  bug: { icon: Bug, titleClassName: "text-red-700" },
  quote: { icon: Quote, titleClassName: "text-stone-700" },
  summary: { icon: ClipboardList, titleClassName: "text-indigo-700" },
  abstract: { icon: ClipboardList, titleClassName: "text-violet-700" },
  example: { icon: FlaskConical, titleClassName: "text-teal-700" },
  todo: { icon: ListTodo, titleClassName: "text-fuchsia-700" },
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

function renderTextWithSoftBreaks(text: string) {
  const lines = text.split("\n");
  return lines.map((line, idx) => (
    <Fragment key={`${line}-${idx}`}>
      {idx > 0 ? <br /> : null}
      {line}
    </Fragment>
  ));
}

function renderCalloutTitle(type: string, title: string) {
  const meta = CALLOUT_META[type] || CALLOUT_META.note;
  const Icon = meta.icon;
  return (
    <div className={`mb-2 flex items-center gap-2 text-sm tracking-wide font-sans font-semibold ${meta.titleClassName}`}>
      <Icon size={18} strokeWidth={2.2} aria-hidden="true" />
      <span>{title}</span>
    </div>
  );
}

function normalizeAssetSrc(src?: string): string | undefined {
  if (!src) return src;
  if (src.startsWith("/api/")) {
    return buildBackendUrl(src);
  }
  return src;
}

export default function MarkdownRenderer({ content, depth = 0, sourceSlug }: MarkdownRendererProps) {
  const processedContent = useMemo(() => preprocessMarkdown(content), [content]);
  const urlTransform = useCallback((url: string) => {
    if (url.startsWith("obsidian-embed://") || url.startsWith("obsidian-details://")) {
      return url;
    }
    return defaultUrlTransform(url);
  }, []);

  const components: Components = {
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
        isInline ? (
          <code className={`${className} bg-neutral-200/60 px-1.5 py-0.5 rounded font-mono text-sm border border-neutral-300/50 text-foreground`} {...props}>
            {children}
          </code>
        ) : (
          <div className="relative group my-10">
            <CopyButton text={codeText} />
            <SyntaxHighlighter
              style={oneLight as any}
              language="text"
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
      const childList = (Array.isArray(children) ? children : [children]).filter(
        (child) => !(typeof child === "string" && child.trim() === ""),
      );
      const first = childList[0];
      const firstText = getPlainText(first).trim();
      const [firstLine, ...restLines] = firstText.split("\n");
      const match = /^\[!([a-zA-Z0-9_-]+)\]([+-])?\s*(.*)$/.exec((firstLine || "").trim());
      if (!match) {
        return (
          <blockquote className="my-6 whitespace-pre-line border-l-[6px] border-stone-300/90 bg-background/50 px-5 py-4 rounded-r-sm text-stone-600 before:content-none after:content-none [&>p]:my-4 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0 [&>p]:whitespace-pre-line [&>p:first-of-type]:before:content-none [&>p:last-of-type]:after:content-none">

            {children}
          </blockquote>
        );
      }

      const type = resolveCalloutType(match[1]);
      const foldMarker = match[2] as "+" | "-" | undefined;
      const title = (match[3] || "").trim() || calloutDefaultTitle(type);
      const inlineBody = restLines.join("\n").trim();
      const body = (
        <div className="prose prose-neutral max-w-none">
          {inlineBody ? <p>{renderTextWithSoftBreaks(inlineBody)}</p> : null}
          {childList.slice(1)}
        </div>
      );

      if (foldMarker) {
        return (
          <details open={foldMarker === "+"} className={`my-6 border-l-4 px-5 py-4 rounded-r-sm ${CALLOUT_STYLES[type] || CALLOUT_STYLES.note}`}>
            <summary className="mb-2 cursor-pointer select-none marker:content-none">
              {renderCalloutTitle(type, title)}
            </summary>
            {body}
          </details>
        );
      }

      return (
        <div className={`my-6 border-l-4 px-5 py-4 rounded-r-sm ${CALLOUT_STYLES[type] || CALLOUT_STYLES.note}`}>
          {renderCalloutTitle(type, title)}
          {body}
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
      prose-strong:font-black prose-strong:text-foreground
      prose-a:text-foreground prose-a:decoration-1 prose-a:underline-offset-4 prose-a:font-bold
      prose-blockquote:border-l-[6px] prose-blockquote:border-stone-300/90 prose-blockquote:bg-background/50 prose-blockquote:py-4 prose-blockquote:px-5 prose-blockquote:rounded-r-sm prose-blockquote:font-sans prose-blockquote:not-italic prose-blockquote:shadow-none prose-blockquote:text-stone-600 prose-blockquote:whitespace-pre-line prose-blockquote:before:content-none prose-blockquote:after:content-none [&_blockquote_p:first-of-type]:before:content-none [&_blockquote_p:last-of-type]:after:content-none
      prose-li:marker:text-stone-400 prose-ul:list-disc prose-ol:list-decimal
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
