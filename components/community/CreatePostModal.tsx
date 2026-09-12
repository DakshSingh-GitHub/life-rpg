"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Bold,
  Italic,
  Heading,
  Quote,
  Code,
  List,
  ListOrdered,
  Eye,
  PenLine,
  Send,
} from "lucide-react";
import { PostTag } from "@/lib/types/community";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: { title: string; content: string; tag: PostTag }) => Promise<void>;
  currentUserName: string;
}

const TAG_OPTIONS: { tag: PostTag; emoji: string; color: string }[] = [
  { tag: "Discussion", emoji: "💬", color: "bg-[#DCEBFE] text-blue-900 border-blue-950" },
  { tag: "Strategy", emoji: "⚔️", color: "bg-[#E8FAF5] text-emerald-900 border-emerald-950" },
  { tag: "Milestone", emoji: "🏆", color: "bg-[#FEF3C7] text-amber-900 border-amber-950" },
  { tag: "Accountability", emoji: "🛡️", color: "bg-[#FFEAEF] text-pink-900 border-pink-950" },
  { tag: "Lore", emoji: "📜", color: "bg-[#F3E8FF] text-purple-900 border-purple-950" },
  { tag: "Victory", emoji: "🎉", color: "bg-[#FFF0E6] text-orange-900 border-orange-950" },
];

export function CreatePostModal({
  isOpen,
  onClose,
  onSubmit,
  currentUserName,
}: CreatePostModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTag, setSelectedTag] = useState<PostTag>("Discussion");
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const insertFormatting = (syntaxStart: string, syntaxEnd: string = "") => {
    const textarea = document.getElementById("post-content-input") as HTMLTextAreaElement | null;
    if (!textarea) {
      setContent((prev) => prev + syntaxStart + syntaxEnd);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || "text";
    const replacement = `${syntaxStart}${selectedText}${syntaxEnd}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + syntaxStart.length,
        start + syntaxStart.length + selectedText.length
      );
    }, 10);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a title for your post.");
      return;
    }
    if (!content.trim()) {
      setError("Please write some content (Markdown supported).");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        tag: selectedTag,
      });
      setTitle("");
      setContent("");
      setActiveTab("write");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to publish post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-[#FDF8EE] border-3 border-slate-950 rounded-3xl p-5 sm:p-7 shadow-[8px_8px_0px_0px_#020617] max-w-2xl w-full my-auto text-left relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-slate-950">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#FFEAEF] border-2 border-slate-950 flex items-center justify-center shadow-[2px_2px_0px_0px_#020617]">
                <PenLine className="w-5 h-5 text-[#FF6B8B]" />
              </div>
              <div>
                <h2 className="font-display font-black text-xl text-slate-950 leading-tight">
                  Forge a Guild Post
                </h2>
                <p className="text-xs font-bold text-slate-500">
                  Sharing to the Realm as <span className="text-slate-900 font-extrabold">{currentUserName}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-[#FFEAEF] border-2 border-slate-950 flex items-center justify-center shadow-[2px_2px_0px_0px_#020617] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
            >
              <X className="w-4 h-4 text-slate-900" />
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-rose-100 border-2 border-rose-900 rounded-2xl text-rose-900 text-xs font-bold shadow-[2px_2px_0px_0px_#020617]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Tag Selection */}
            <div>
              <label className="block text-xs font-display font-black text-slate-800 uppercase tracking-wider mb-1.5">
                Category / Badge
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TAG_OPTIONS.map((item) => {
                  const isSelected = selectedTag === item.tag;
                  return (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => setSelectedTag(item.tag)}
                      className={`px-3 py-1 rounded-full text-xs font-display font-black border-2 border-slate-950 flex items-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? `${item.color} shadow-[2px_2px_0px_0px_#020617] scale-105`
                          : "bg-white text-slate-600 hover:bg-slate-50 opacity-80"
                      }`}
                    >
                      <span>{item.emoji}</span>
                      <span>{item.tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-display font-black text-slate-800 uppercase tracking-wider mb-1.5">
                Post Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post title..."
                maxLength={120}
                className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-950 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B8B] shadow-[2px_2px_0px_0px_#020617]"
              />
            </div>

            {/* Content & Markdown Editor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-display font-black text-slate-800 uppercase tracking-wider">
                  Post Content (Markdown)
                </label>
                {/* Tabs: Write vs Preview */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border-2 border-slate-950 shadow-[1.5px_1.5px_0px_0px_#020617]">
                  <button
                    type="button"
                    onClick={() => setActiveTab("write")}
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-display font-black transition-all cursor-pointer ${
                      activeTab === "write"
                        ? "bg-[#FFEAEF] text-[#FF6B8B] border border-slate-950"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <PenLine className="w-3 h-3" />
                    <span>Write</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("preview")}
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-display font-black transition-all cursor-pointer ${
                      activeTab === "preview"
                        ? "bg-[#E8FAF5] text-emerald-800 border border-slate-950"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Preview</span>
                  </button>
                </div>
              </div>

              {/* Formatting Toolbar */}
              {activeTab === "write" && (
                <div className="flex items-center gap-1 flex-wrap bg-white/90 p-1.5 rounded-xl border-2 border-slate-950 mb-2 shadow-[1.5px_1.5px_0px_0px_#020617]">
                  <button
                    type="button"
                    title="Bold (**text**)"
                    onClick={() => insertFormatting("**", "**")}
                    className="p-1.5 rounded-lg hover:bg-[#FFEAEF] text-slate-700 hover:text-slate-950 transition-colors"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Italic (*text*)"
                    onClick={() => insertFormatting("*", "*")}
                    className="p-1.5 rounded-lg hover:bg-[#FFEAEF] text-slate-700 hover:text-slate-950 transition-colors"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Heading (### Heading)"
                    onClick={() => insertFormatting("### ")}
                    className="p-1.5 rounded-lg hover:bg-[#FFEAEF] text-slate-700 hover:text-slate-950 transition-colors"
                  >
                    <Heading className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Blockquote (> quote)"
                    onClick={() => insertFormatting("> ")}
                    className="p-1.5 rounded-lg hover:bg-[#FFEAEF] text-slate-700 hover:text-slate-950 transition-colors"
                  >
                    <Quote className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Code snippet (`code`)"
                    onClick={() => insertFormatting("`", "`")}
                    className="p-1.5 rounded-lg hover:bg-[#FFEAEF] text-slate-700 hover:text-slate-950 transition-colors"
                  >
                    <Code className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Bullet List (- item)"
                    onClick={() => insertFormatting("- ")}
                    className="p-1.5 rounded-lg hover:bg-[#FFEAEF] text-slate-700 hover:text-slate-950 transition-colors"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Numbered List (1. item)"
                    onClick={() => insertFormatting("1. ")}
                    className="p-1.5 rounded-lg hover:bg-[#FFEAEF] text-slate-700 hover:text-slate-950 transition-colors"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-bold text-slate-400 ml-auto hidden sm:inline">
                    Markdown ready ⚡
                  </span>
                </div>
              )}

              {/* Editor / Preview Area */}
              {activeTab === "write" ? (
                <textarea
                  id="post-content-input"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your post content here (Markdown supported)..."
                  rows={7}
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-950 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B8B] shadow-[2px_2px_0px_0px_#020617] font-mono leading-relaxed"
                />
              ) : (
                <div className="min-h-[175px] max-h-[260px] overflow-y-auto px-4 py-3 bg-white border-2 border-slate-950 rounded-2xl shadow-[2px_2px_0px_0px_#020617]">
                  {content.trim() ? (
                    <MarkdownRenderer content={content} />
                  ) : (
                    <p className="text-xs font-bold text-slate-400 italic">
                      No content to preview yet. Switch to "Write" to draft your post.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t-2 border-slate-950">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white hover:bg-slate-100 border-2 border-slate-950 rounded-2xl text-xs font-display font-black text-slate-700 shadow-[2px_2px_0px_0px_#020617] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2 bg-[#FF6B8B] hover:bg-[#ff5277] disabled:opacity-50 text-white border-2 border-slate-950 rounded-2xl text-xs font-display font-black shadow-[3px_3px_0px_0px_#020617] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Broadcasting..." : "Publish Post"}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
