import ReactMarkdown from 'react-markdown'

const components = {
  h1: ({ children }) => <h1 className="text-base font-semibold text-newton-text mt-3 mb-1">{children}</h1>,
  h2: ({ children }) => <h2 className="text-sm font-semibold text-newton-text mt-3 mb-1">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold text-newton-text mt-2 mb-1">{children}</h3>,
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-newton-text">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  code: ({ children }) => (
    <code className="bg-newton-surface px-1 py-0.5 rounded text-xs">{children}</code>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-newton-border pl-3 my-2 text-newton-muted">{children}</blockquote>
  ),
  hr: () => <hr className="border-newton-border my-3" />,
}

export default function MarkdownContent({ children, className = '' }) {
  return (
    <div className={`text-sm leading-relaxed text-newton-text ${className}`}>
      <ReactMarkdown components={components}>{children}</ReactMarkdown>
    </div>
  )
}
