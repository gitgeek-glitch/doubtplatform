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
            <code className="bg-gray-800 px-1.5 py-0.5 rounded text-sm" {...props}>
              {children}
            </code>
          )
        },
        a: ({ node, ...props }) => (
          <a
            {...props}
            className="text-purple-400 hover:text-purple-300 no-underline hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          />
        ),
        img: ({ node, ...props }) => <img {...props} className="rounded-lg max-w-full h-auto my-4" />,
        table: ({ node, ...props }) => (
          <div className="overflow-x-auto my-4">
            <table {...props} className="border-collapse w-full" />
          </div>
        ),
        th: ({ node, ...props }) => (
          <th {...props} className="border border-gray-700 px-4 py-2 text-left bg-gray-800" />
        ),
        td: ({ node, ...props }) => <td {...props} className="border border-gray-700 px-4 py-2" />,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
