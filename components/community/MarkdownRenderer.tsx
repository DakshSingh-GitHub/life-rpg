"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div className={`markdown-body text-slate-800 break-words ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-display font-black text-slate-950 mt-3 mb-1.5 tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-display font-black text-slate-950 mt-2.5 mb-1 tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm sm:text-base font-display font-black text-slate-900 mt-2 mb-1">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed mb-2 last:mb-0">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-2 space-y-1 text-xs sm:text-sm font-semibold text-slate-700">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-2 space-y-1 text-xs sm:text-sm font-semibold text-slate-700">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#FF6B8B] pl-3 py-1.5 my-2 bg-[#FFEAEF]/60 rounded-r-xl text-xs sm:text-sm font-bold text-slate-700 italic shadow-[1px_1px_0px_0px_#020617]">
              {children}
            </blockquote>
          ),
          code: ({ className: codeClassName, children, ...props }) => {
            const match = /language-(\w+)/.exec(codeClassName || "");
            const isBlock = Boolean(match) || String(children).includes("\n");
            if (isBlock) {
              return (
                <div className="my-2 rounded-2xl bg-slate-950 text-emerald-400 p-3.5 font-mono text-xs overflow-x-auto border-2 border-slate-950 shadow-[2px_2px_0px_0px_#020617]">
                  <code>{children}</code>
                </div>
              );
            }
            return (
              <code
                className="bg-[#FFF0E6] text-[#FF5722] px-1.5 py-0.5 rounded-md font-mono text-xs border border-[#FF5722]/30 font-bold"
                {...props}
              >
                {children}
              </code>
            );
          },
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2563EB] hover:underline font-bold underline-offset-2"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-xl border-2 border-slate-950 shadow-[2px_2px_0px_0px_#020617]">
              <table className="w-full text-left border-collapse bg-white">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="bg-[#FEF3C7] border-b-2 border-slate-950 px-3 py-1.5 text-xs font-display font-black text-slate-900">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">
              {children}
            </td>
          ),
          hr: () => <hr className="my-3 border-t-2 border-dashed border-slate-300" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
