import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { mockPosts } from '@/data/mockData';
import { Link } from 'react-router-dom';
import { parseWikiLinks, parseHashTags } from '@/lib/markdown';
import CopyButton from './CopyButton';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Pre-process content
  const contentWithLinks = parseWikiLinks(content, mockPosts);
  const processedContent = parseHashTags(contentWithLinks);

  return (
    <div className="prose prose-neutral max-w-none 
      prose-headings:font-serif prose-headings:text-foreground prose-headings:font-bold
      prose-h1:text-4xl prose-h1:font-black prose-h1:tracking-tight prose-h1:mb-8
      prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border
      prose-h3:text-xl prose-h3:font-bold prose-h3:mt-8 prose-h3:mb-4
      prose-p:text-foreground prose-p:leading-relaxed
      prose-strong:font-black prose-strong:text-foreground prose-strong:bg-neutral-200/50 prose-strong:rounded-sm prose-strong:px-1 prose-strong:mx-0.5 prose-strong:inline-block prose-strong:leading-none prose-strong:py-0.5
      prose-a:text-foreground prose-a:decoration-1 prose-a:underline-offset-4 prose-a:font-bold
      prose-blockquote:border-l-4 prose-blockquote:border-foreground prose-blockquote:bg-stone-200/20 prose-blockquote:py-4 prose-blockquote:px-8 prose-blockquote:rounded-r-lg prose-blockquote:font-kaiti prose-blockquote:italic prose-blockquote:shadow-sm prose-blockquote:text-stone-700
      prose-li:marker:text-stone-400 prose-ul:list-disc prose-ol:list-decimal
      prose-pre:bg-transparent prose-pre:p-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="relative group my-10">
                <CopyButton text={String(children).replace(/\n$/, '')} />
                <SyntaxHighlighter
                  style={oneLight}
                  language={match[1]}
                  PreTag="div"
                  useInlineStyles={true}
                  customStyle={{ 
                    background: '#FBFBFA', 
                    padding: '2rem', 
                    borderRadius: '0', 
                    fontSize: '0.875rem', 
                    border: '1px solid #D6D3D1',
                    margin: 0
                  }}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className={`${className} bg-neutral-200/60 px-1.5 py-0.5 rounded font-mono text-sm border border-neutral-300/50 text-foreground`} {...props}>
                {children}
              </code>
            );
          },
          // Custom link component to handle internal links via React Router
          a({ href, children, ...props }) {
              if (href?.startsWith('/')) {
                  return <Link to={href} {...props}>{children}</Link>
              }
              return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
