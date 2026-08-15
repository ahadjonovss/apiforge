import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/core/lib/cn'

export function Markdown({ source, className }: { source: string; className?: string }) {
  if (!source.trim()) return null

  return (
    <div className={cn('flex flex-col gap-3 text-sm leading-relaxed', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="mt-2 text-lg font-semibold">{children}</h1>,
          h2: ({ children }) => <h2 className="mt-2 text-base font-semibold">{children}</h2>,
          h3: ({ children }) => <h3 className="mt-1 text-sm font-semibold">{children}</h3>,
          p: ({ children }) => <p className="text-xs text-foreground/90">{children}</p>,
          ul: ({ children }) => (
            <ul className="flex list-disc flex-col gap-1 pl-5 text-xs">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="flex list-decimal flex-col gap-1 pl-5 text-xs">{children}</ol>
          ),
          li: ({ children }) => <li className="text-foreground/90">{children}</li>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary hover:underline"
            >
              {children}
            </a>
          ),
          code: ({ className: lang, children }) =>
            lang ? (
              <code className="font-mono text-[11px]">{children}</code>
            ) : (
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                {children}
              </code>
            ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-md border border-border bg-muted p-3">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-border pl-3 text-xs text-muted-foreground">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border bg-muted px-2 py-1 text-left font-medium">
              {children}
            </th>
          ),
          td: ({ children }) => <td className="border border-border px-2 py-1">{children}</td>,
          hr: () => <hr className="border-border" />,
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  )
}
