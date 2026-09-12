"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageSquare,
  Share2,
  Trash2,
  Send,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { CommunityPost, CommunityComment } from "@/lib/types/community";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { CommentThread } from "./CommentThread";
import { getPostComments, addComment, deleteComment, getCachedPostComments } from "@/lib/community-service";
import { UserProfile } from "@/lib/types/rpg";

interface PostCardProps {
  post: CommunityPost;
  currentUserId: string;
  currentUserProfile: UserProfile;
  onToggleLike: (postId: string) => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
}

const AVATAR_EMOJIS: Record<string, string> = {
  warrior: "🥊",
  mage: "🧠",
  rogue: "⚡",
  druid: "🌿",
};

const TAG_COLORS: Record<string, string> = {
  Discussion: "bg-[#DCEBFE] text-blue-950 border-blue-950",
  Strategy: "bg-[#E8FAF5] text-emerald-950 border-emerald-950",
  Milestone: "bg-[#FEF3C7] text-amber-950 border-amber-950",
  Accountability: "bg-[#FFEAEF] text-pink-950 border-pink-950",
  Lore: "bg-[#F3E8FF] text-purple-950 border-purple-950",
  Victory: "bg-[#FFF0E6] text-orange-950 border-orange-950",
};

export function PostCard({
  post,
  currentUserId,
  currentUserProfile,
  onToggleLike,
  onDeletePost,
}: PostCardProps) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isOwner = post.user_id === currentUserId;
  const avatarEmoji = AVATAR_EMOJIS[post.author_avatar_class] || "🛡️";
  const tagColorClass = TAG_COLORS[post.tag] || "bg-[#FDF8EE] text-slate-900 border-slate-950";

  // Format date and time
  const formatDateTime = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  };

  const handleToggleComments = async () => {
    const nextState = !commentsOpen;
    setCommentsOpen(nextState);
    if (nextState) {
      const cached = getCachedPostComments(post.id);
      if (cached) {
        setComments(cached);
      } else {
        setLoadingComments(true);
      }
      try {
        const data = await getPostComments(post.id);
        setComments(data);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const handleAddTopComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    try {
      setSubmittingComment(true);
      const res = await addComment(
        { id: currentUserId },
        currentUserProfile,
        {
          postId: post.id,
          parentId: null,
          content: newCommentText.trim(),
        }
      );
      if (res.comment) {
        setComments((prev) => [...prev, res.comment!]);
        post.comments_count = (post.comments_count || 0) + 1;
      }
      setNewCommentText("");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReplyToComment = async (parentId: string, content: string) => {
    const res = await addComment(
      { id: currentUserId },
      currentUserProfile,
      {
        postId: post.id,
        parentId,
        content,
      }
    );
    if (res.comment) {
      // Reload comments tree to maintain nested structure
      const updated = await getPostComments(post.id);
      setComments(updated);
      post.comments_count = (post.comments_count || 0) + 1;
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment(commentId, currentUserId, post.id);
    const updated = await getPostComments(post.id);
    setComments(updated);
  };

  const handleLike = async () => {
    if (isLiking) return;
    try {
      setIsLiking(true);
      await onToggleLike(post.id);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <article className="bg-white border-3 border-slate-950 rounded-3xl p-5 sm:p-6 shadow-[5px_5px_0px_0px_#020617] hover:shadow-[7px_7px_0px_0px_#020617] transition-all relative overflow-hidden">
      {/* Top Banner: Tag & Actions */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar with class badge */}
          <div className="relative">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#E8FAF5] border-2 border-slate-950 flex items-center justify-center text-xl sm:text-2xl shadow-[2px_2px_0px_0px_#020617]">
              {avatarEmoji}
            </div>
            <div className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-[#FFD166] text-slate-950 border border-slate-950 rounded-md text-[9px] font-display font-black shadow-[1px_1px_0px_0px_#020617]">
              Lv.{post.author_level}
            </div>
          </div>

          {/* User Name & Username & Timestamp */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-black text-sm sm:text-base text-slate-950 leading-tight">
                {post.author_name}
              </h3>
              <span className="text-xs font-bold text-slate-400">
                @{post.author_username}
              </span>
            </div>
            <div className="text-[11px] font-bold text-slate-500 mt-0.5">
              {formatDateTime(post.created_at)}
            </div>
          </div>
        </div>

        {/* Tag & Delete */}
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-0.5 rounded-full border-2 text-[11px] font-display font-black shadow-[1.5px_1.5px_0px_0px_#020617] ${tagColorClass}`}
          >
            {post.tag}
          </span>
          {isOwner && (
            <button
              type="button"
              onClick={() => onDeletePost(post.id)}
              title="Delete this post"
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-slate-950 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Post Title */}
      {post.title && (
        <h2 className="font-display font-black text-lg sm:text-xl text-slate-950 mt-2 mb-2 leading-snug">
          {post.title}
        </h2>
      )}

      {/* Post Body (Markdown Formatted) */}
      <div className="mt-2 text-slate-800">
        <MarkdownRenderer content={post.content} />
      </div>

      {/* Interaction Footer Bar */}
      <div className="mt-5 pt-3.5 border-t-2 border-slate-950/10 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Like Button */}
          <button
            type="button"
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-slate-950 text-xs font-display font-black transition-all cursor-pointer shadow-[2px_2px_0px_0px_#020617] active:translate-x-[1px] active:translate-y-[1px] ${
              post.is_liked_by_me
                ? "bg-[#FFEAEF] text-[#FF6B8B] fill-[#FF6B8B]"
                : "bg-white text-slate-700 hover:bg-[#FFEAEF]/40"
            }`}
          >
            <Heart
              className={`w-4 h-4 ${
                post.is_liked_by_me ? "fill-[#FF6B8B] text-[#FF6B8B]" : "text-slate-600"
              }`}
            />
            <span>{post.likes_count}</span>
            <span className="hidden sm:inline">Likes</span>
          </button>

          {/* Comment Button */}
          <button
            type="button"
            onClick={handleToggleComments}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-slate-950 text-xs font-display font-black transition-all cursor-pointer shadow-[2px_2px_0px_0px_#020617] active:translate-x-[1px] active:translate-y-[1px] ${
              commentsOpen
                ? "bg-[#DCEBFE] text-blue-900"
                : "bg-white text-slate-700 hover:bg-[#DCEBFE]/40"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>{post.comments_count}</span>
            <span className="hidden sm:inline">Replies</span>
            {commentsOpen ? (
              <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            )}
          </button>
        </div>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border-2 border-slate-950 rounded-full text-xs font-display font-black text-slate-700 shadow-[2px_2px_0px_0px_#020617] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copiedLink ? "Link Copied!" : "Share"}</span>
        </button>
      </div>

      {/* Expandable Threaded Comments Section */}
      <AnimatePresence>
        {commentsOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 pt-4 border-t-2 border-dashed border-slate-300"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-display font-black text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                <span>Guild Discussion Threads ({post.comments_count})</span>
              </h4>
            </div>

            {/* Post Root Comment Input */}
            <form onSubmit={handleAddTopComment} className="mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 px-4 py-2 bg-[#FDF8EE] border-2 border-slate-950 rounded-2xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B8B] shadow-[2px_2px_0px_0px_#020617]"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !newCommentText.trim()}
                  className="px-4 py-2 bg-[#FF6B8B] hover:bg-[#ff5277] disabled:opacity-50 text-white font-display font-black text-xs rounded-2xl border-2 border-slate-950 shadow-[2px_2px_0px_0px_#020617] flex items-center gap-1.5 cursor-pointer active:translate-x-[1px] active:translate-y-[1px] transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </form>

            {/* Threaded Comments List */}
            {loadingComments ? (
              <div className="py-6 text-center text-xs font-bold text-slate-500">
                Loading comments...
              </div>
            ) : comments.length === 0 ? (
              <div className="py-6 text-center bg-[#FDF8EE] border-2 border-dashed border-slate-300 rounded-2xl p-4">
                <p className="font-display font-black text-xs text-slate-700">
                  No comments yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <CommentThread
                    key={comment.id}
                    comment={comment}
                    postId={post.id}
                    currentUserId={currentUserId}
                    onReply={handleReplyToComment}
                    onDelete={handleDeleteComment}
                    depth={0}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
