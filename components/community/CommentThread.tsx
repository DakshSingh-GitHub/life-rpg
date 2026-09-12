"use client";

import React, { useState } from "react";
import { MessageSquare, CornerDownRight, Trash2, Send, X } from "lucide-react";
import { CommunityComment } from "@/lib/types/community";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface CommentThreadProps {
  comment: CommunityComment;
  postId: string;
  currentUserId: string;
  onReply: (parentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  depth?: number;
}

const AVATAR_EMOJIS: Record<string, string> = {
  warrior: "🥊",
  mage: "🧠",
  rogue: "⚡",
  druid: "🌿",
};

export function CommentThread({
  comment,
  postId,
  currentUserId,
  onReply,
  onDelete,
  depth = 0,
}: CommentThreadProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = comment.user_id === currentUserId;
  const avatarEmoji = AVATAR_EMOJIS[comment.author_avatar_class] || "🛡️";

  // Format date nicely
  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      setIsSubmittingReply(true);
      await onReply(comment.id, replyContent.trim());
      setReplyContent("");
      setIsReplying(false);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Remove this comment from the guild log?")) return;
    try {
      setIsDeleting(true);
      await onDelete(comment.id);
    } finally {
      setIsDeleting(false);
    }
  };

  // Indentation style for nested replies
  const maxVisualDepth = 4;
  const currentLevel = Math.min(depth, maxVisualDepth);

  return (
    <div className={`relative ${depth > 0 ? "mt-3 pl-3 sm:pl-4 border-l-2 border-slate-300" : "mt-3"}`}>
      <div className="p-3 sm:p-3.5 bg-white/95 border-2 border-slate-950 rounded-2xl shadow-[2px_2px_0px_0px_#020617] transition-all">
        {/* Author Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#E8FAF5] border border-slate-950 flex items-center justify-center text-xs shrink-0 shadow-[1px_1px_0px_0px_#020617]">
              {avatarEmoji}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-display font-black text-xs text-slate-950">
                {comment.author_name}
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                @{comment.author_username}
              </span>
              <span className="px-1.5 py-0.2 bg-[#FEF3C7] text-slate-900 border border-slate-950 rounded-full text-[9px] font-display font-black">
                Lv. {comment.author_level}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
              {formatDate(comment.created_at)}
            </span>
            {isOwner && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                title="Delete comment"
                className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mt-2 text-xs sm:text-sm">
          <MarkdownRenderer content={comment.content} />
        </div>

        {/* Reply Action */}
        <div className="mt-2.5 flex items-center gap-3 pt-1.5 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsReplying(!isReplying)}
            className="inline-flex items-center gap-1 text-[11px] font-display font-black text-slate-600 hover:text-[#FF6B8B] transition-colors cursor-pointer"
          >
            <CornerDownRight className="w-3 h-3" />
            <span>{isReplying ? "Cancel Reply" : "Reply"}</span>
          </button>
        </div>

        {/* Inline Reply Box */}
        {isReplying && (
          <form onSubmit={handleSendReply} className="mt-2.5 pt-2 border-t-2 border-dashed border-slate-200">
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`Replying to @${comment.author_username}...`}
                className="flex-1 px-3 py-1.5 bg-[#FDF8EE] border-2 border-slate-950 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FF6B8B]"
                autoFocus
              />
              <button
                type="submit"
                disabled={isSubmittingReply || !replyContent.trim()}
                className="px-3 py-1.5 bg-[#FF6B8B] hover:bg-[#ff5277] disabled:opacity-50 text-white font-display font-black text-xs rounded-xl border-2 border-slate-950 shadow-[1.5px_1.5px_0px_0px_#020617] flex items-center gap-1 cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
              >
                <Send className="w-3 h-3" />
                <span>Post</span>
              </button>
              <button
                type="button"
                onClick={() => setIsReplying(false)}
                className="p-1.5 text-slate-500 hover:text-slate-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Recursive Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-1">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              postId={postId}
              currentUserId={currentUserId}
              onReply={onReply}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
