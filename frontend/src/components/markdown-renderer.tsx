"use client"

import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"

interface MarkdownRendererProps {
  content: string
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="animate-pulse bg-gray-800 h-40 rounded-md" />
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        code({ node, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "")
          const inline = !match && !className
          
          if (!inline && match) {
            // Remove the ref prop which is causing the type error
            const { ref, ...restProps } = props as any
            
            return (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                customStyle={{ backgroundColor: "#111827", padding: "1rem", margin: "1rem 0", borderRadius: "0.375rem" }}
                {...restProps}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            )
          }
          
          return (
            <code className="markdown-code" {...props}>
              {children}
            </code>
          )
        },
        a: ({ node, ...props }) => (
          <a
            {...props}
            className="markdown-link"
            target="_blank"
            rel="noopener noreferrer"
          />
        ),
        img: ({ node, ...props }) => <img {...props} className="markdown-image" />,
        table: ({ node, ...props }) => (
          <div className="markdown-table-container">
            <table {...props} className="markdown-table" />
          </div>
        ),
        th: ({ node, ...props }) => (
          <th {...props} className="markdown-th" />
        ),
        td: ({ node, ...props }) => <td {...props} className="markdown-td" />,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
