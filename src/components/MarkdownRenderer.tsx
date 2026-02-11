import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { mockPosts } from '@/data/mockData';
import { Link } from 'react-router-dom';
import { parseWikiLinks, parseHashTags } from '@/lib/markdown';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Pre-process content
  const contentWithLinks = parseWikiLinks(content, mockPosts);
  const processedContent = parseHashTags(contentWithLinks);

  return (
    <div className="prose prose-neutral max-w-none prose-headings:font-serif prose-a:text-foreground prose-a:decoration-1 prose-a:underline-offset-4 prose-blockquote:border-l-2 prose-blockquote:border-black prose-blockquote:bg-transparent prose-blockquote:font-serif prose-blockquote:not-italic prose-li:marker:text-neutral-400">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={oneLight}
                language={match[1]}
                PreTag="div"
                customStyle={{ background: '#f5f5f5', padding: '1.5rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={`${className} bg-neutral-100 px-1 py-0.5 rounded font-mono text-sm`} {...props}>
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
