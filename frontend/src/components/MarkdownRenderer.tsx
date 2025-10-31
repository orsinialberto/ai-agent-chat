import React, { type InputHTMLAttributes, type ReactNode } from 'react';
import type { Pluggable, PluggableList } from 'unified';

type ChildrenProps = {
  children?: ReactNode;
};

type CodeProps = ChildrenProps & {
  inline?: boolean;
  className?: string;
};

type AnchorProps = ChildrenProps & {
  href?: string;
};

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = ''
}) => {
  // Import dinamico per evitare problemi di build
  const [ReactMarkdown, setReactMarkdown] = React.useState<typeof import('react-markdown')['default'] | null>(null);
  const [remarkGfm, setRemarkGfm] = React.useState<typeof import('remark-gfm')['default'] | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadMarkdown = async () => {
      try {
        const [markdownModule, gfmModule] = await Promise.all([
          import('react-markdown'),
          import('remark-gfm')
        ]);
        
        setReactMarkdown(() => markdownModule.default);
        setRemarkGfm(() => gfmModule.default);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading markdown modules:', err);
        setError(err instanceof Error ? err.message : 'Failed to load markdown');
        setIsLoading(false);
      }
    };

    loadMarkdown();
  }, []);

  const remarkPluginList = React.useMemo<PluggableList | undefined>(
    () => (remarkGfm ? [remarkGfm as Pluggable] : undefined),
    [remarkGfm]
  );

  if (isLoading) {
    return (
      <div className={`markdown-content ${className}`} style={{ fontFamily: 'system-ui, sans-serif' }}>
        <div className="whitespace-pre-wrap text-sm text-gray-700">
          {content}
        </div>
      </div>
    );
  }

  if (error || !ReactMarkdown) {
    return (
      <div className={`markdown-content ${className}`} style={{ fontFamily: 'system-ui, sans-serif' }}>
        <div className="whitespace-pre-wrap text-sm text-gray-700">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`markdown-content ${className}`}
      style={{ 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        lineHeight: '1.6',
        color: '#374151'
      }}
    >
      <ReactMarkdown
        remarkPlugins={remarkPluginList}
        components={{
          // Code blocks
          code({ inline, className, children }: CodeProps) {
            const inlineClassName = [
              'bg-gray-100 text-gray-800 px-1 py-0 rounded text-sm font-mono border',
              className
            ]
              .filter(Boolean)
              .join(' ');
            if (inline) {
              return (
                <code 
                  className={inlineClassName}
                  style={{ 
                    backgroundColor: '#f3f4f6', 
                    color: '#1f2937',
                    padding: '0.05rem 0.3rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.8125rem',
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    border: '1px solid #d1d5db',
                    verticalAlign: 'middle',
                    lineHeight: '1'
                  }}
                >
                  {children}
                </code>
              );
            }
            // Code block multi-linea con sfondo chiaro e dimensioni ridotte
            const blockClassName = ['text-xs font-mono', className]
              .filter(Boolean)
              .join(' ');
            return (
              <pre 
                className="bg-gray-50 text-gray-800 p-1 rounded overflow-x-auto my-1 border border-gray-200"
                style={{
                  backgroundColor: '#f9fafb',
                  color: '#1f2937',
                  padding: '0.25rem 0.4rem',
                  borderRadius: '0.375rem',
                  overflowX: 'auto',
                  margin: '0.25rem 0',
                  border: '1px solid #e5e7eb',
                  display: 'inline-block',
                  maxWidth: '100%',
                  width: 'fit-content',
                  verticalAlign: 'middle'
                }}
              >
                <code 
                  className={blockClassName}
                  style={{
                    fontSize: '0.8125rem',
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    color: '#374151',
                    lineHeight: '1'
                  }}
                >
                  {children}
                </code>
              </pre>
            );
          },
          
          // Tables
          table({ children }: ChildrenProps) {
            return (
              <div 
                className="overflow-x-auto my-4 rounded-lg border border-gray-200"
                style={{
                  overflowX: 'auto',
                  margin: '1rem 0',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb'
                }}
              >
                <table 
                  className="min-w-full border-collapse"
                  style={{
                    minWidth: '100%',
                    borderCollapse: 'collapse'
                  }}
                >
                  {children}
                </table>
              </div>
            );
          },
          
          // Headers
          h1({ children }: ChildrenProps) {
            return (
              <h1 
                className="text-2xl font-bold text-gray-900 mt-6 mb-4 pb-2 border-b border-gray-200"
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#111827',
                  marginTop: '1.5rem',
                  marginBottom: '1rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid #e5e7eb'
                }}
              >
                {children}
              </h1>
            );
          },
          
          h2({ children }: ChildrenProps) {
            return (
              <h2 
                className="text-xl font-semibold text-gray-800 mt-5 mb-3"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginTop: '1.25rem',
                  marginBottom: '0.75rem'
                }}
              >
                {children}
              </h2>
            );
          },
          
          h3({ children }: ChildrenProps) {
            return (
              <h3 
                className="text-lg font-semibold text-gray-800 mt-4 mb-2"
                style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginTop: '1rem',
                  marginBottom: '0.5rem'
                }}
              >
                {children}
              </h3>
            );
          },
          
          h4({ children }: ChildrenProps) {
            return (
              <h4 
                className="text-base font-semibold text-gray-800 mt-3 mb-2"
                style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginTop: '0.75rem',
                  marginBottom: '0.5rem'
                }}
              >
                {children}
              </h4>
            );
          },
          
          h5({ children }: ChildrenProps) {
            return (
              <h5 
                className="text-sm font-semibold text-gray-800 mt-3 mb-1"
                style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginTop: '0.75rem',
                  marginBottom: '0.25rem'
                }}
              >
                {children}
              </h5>
            );
          },
          
          h6({ children }: ChildrenProps) {
            return (
              <h6 
                className="text-xs font-semibold text-gray-800 mt-3 mb-1"
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginTop: '0.75rem',
                  marginBottom: '0.25rem'
                }}
              >
                {children}
              </h6>
            );
          },
          
          // Paragraphs
          p({ children }: ChildrenProps) {
            return (
              <p 
                className="mb-3 text-gray-700"
                style={{
                  marginBottom: '0.75rem',
                  color: '#374151'
                }}
              >
                {children}
              </p>
            );
          },
          
          // Lists
          ul({ children }: ChildrenProps) {
            return (
              <ul 
                className="list-disc list-inside mb-4 space-y-1"
                style={{
                  listStyleType: 'disc',
                  listStylePosition: 'inside',
                  marginBottom: '1rem',
                  paddingLeft: '1rem'
                }}
              >
                {children}
              </ul>
            );
          },
          
          ol({ children }: ChildrenProps) {
            return (
              <ol 
                className="list-decimal list-inside mb-4 space-y-1"
                style={{
                  listStyleType: 'decimal',
                  listStylePosition: 'inside',
                  marginBottom: '1rem',
                  paddingLeft: '1rem'
                }}
              >
                {children}
              </ol>
            );
          },
          
          li({ children }: ChildrenProps) {
            return (
              <li 
                className="text-gray-700"
                style={{
                  color: '#374151',
                  marginBottom: '0.25rem'
                }}
              >
                {children}
              </li>
            );
          },
          
          // Blockquotes
          blockquote({ children }: ChildrenProps) {
            return (
              <blockquote 
                className="border-l-4 border-blue-500 pl-4 my-4 italic text-gray-600 bg-blue-50 py-2 rounded-r"
                style={{
                  borderLeft: '4px solid #3b82f6',
                  paddingLeft: '1rem',
                  margin: '1rem 0',
                  fontStyle: 'italic',
                  color: '#4b5563',
                  backgroundColor: '#eff6ff',
                  padding: '0.5rem 0',
                  borderRadius: '0 0.25rem 0.25rem 0'
                }}
              >
                {children}
              </blockquote>
            );
          },
          
          // Links
          a({ href, children }: AnchorProps) {
            return (
              <a 
                href={href} 
                className="text-blue-600 hover:text-blue-800 underline decoration-blue-300 hover:decoration-blue-500 transition-colors"
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  color: '#2563eb',
                  textDecoration: 'underline',
                  textDecorationColor: '#93c5fd'
                }}
              >
                {children}
              </a>
            );
          },
          
          // Horizontal rules
          hr() {
            return (
              <hr 
                className="my-4 border-gray-300"
                style={{
                  margin: '1rem 0',
                  border: 'none',
                  borderTop: '1px solid #d1d5db'
                }}
              />
            );
          },
          
          // Strong/Bold
          strong({ children }: ChildrenProps) {
            return (
              <strong 
                className="font-semibold text-gray-900"
                style={{
                  fontWeight: '600',
                  color: '#111827'
                }}
              >
                {children}
              </strong>
            );
          },
          
          // Emphasis/Italic
          em({ children }: ChildrenProps) {
            return (
              <em 
                className="italic text-gray-700"
                style={{
                  fontStyle: 'italic',
                  color: '#374151'
                }}
              >
                {children}
              </em>
            );
          },
          
          // Strikethrough (GFM)
          del({ children }: ChildrenProps) {
            return (
              <del 
                className="line-through text-gray-500"
                style={{
                  textDecoration: 'line-through',
                  color: '#6b7280'
                }}
              >
                {children}
              </del>
            );
          },
          
          // Task lists (GFM)
          input({ type, checked, ...props }: InputHTMLAttributes<HTMLInputElement>) {
            if (type === 'checkbox') {
              return (
                <input 
                  type="checkbox" 
                  checked={checked} 
                  readOnly 
                  className="mr-2"
                  style={{ marginRight: '0.5rem' }}
                  {...props}
                />
              );
            }
            return <input type={type} {...props} />;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};