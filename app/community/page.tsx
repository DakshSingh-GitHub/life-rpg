"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  PenLine,
  Flame,
  Coins,
  Shield,
  Sparkles,
  Search,
  Filter,
  TrendingUp,
  Clock,
  User,
  MessageSquare,
  Heart,
  ChevronRight,
  Plus,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { CommunityPost, PostTag } from "@/lib/types/community";
import {
  getCommunityPosts,
  createCommunityPost,
  deleteCommunityPost,
  togglePostLike,
} from "@/lib/community-service";
import { PostCard } from "@/components/community/PostCard";
import { CreatePostModal } from "@/components/community/CreatePostModal";

const AVATAR_EMOJIS: Record<string, string> = {
  warrior: "🥊",
  mage: "🧠",
  rogue: "⚡",
  druid: "🌿",
};

export default function CommunityPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  // Feed State
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"latest" | "likes">("latest");

  // Filter: 'all' vs 'my_posts'
  const [viewFilter, setViewFilter] = useState<"all" | "my_posts">("all");

  // Post Creator Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/community");
    }
  }, [user, loading, router]);

  // Load Posts (Strictly real Supabase data only)
  const loadPosts = async () => {
    try {
      setLoadingPosts(true);
      const data = await getCommunityPosts(user?.id);
      setPosts(data);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [user]);

  // The active user's posts
  const myPosts = useMemo(() => {
    if (!user) return [];
    return posts.filter((p) => p.user_id === user.id);
  }, [posts, user]);

  // The active user's top 3 latest posts for the left panel
  const myTopThreePosts = useMemo(() => {
    return [...myPosts]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
  }, [myPosts]);

  // Filtered & Sorted Feed
  const filteredPosts = useMemo(() => {
    let result = posts;

    // 1. Filter by Author ("All" vs "My Posts")
    if (viewFilter === "my_posts" && user) {
      result = result.filter((p) => p.user_id === user.id);
    }

    // 2. Filter by Tag
    if (selectedTag !== "ALL") {
      result = result.filter((p) => p.tag.toLowerCase() === selectedTag.toLowerCase());
    }

    // 3. Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.author_name.toLowerCase().includes(q) ||
          p.author_username.toLowerCase().includes(q)
      );
    }

    // 4. Sort
    if (sortBy === "likes") {
      result = [...result].sort((a, b) => b.likes_count - a.likes_count);
    } else {
      result = [...result].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return result;
  }, [posts, viewFilter, user, selectedTag, searchQuery, sortBy]);

  // Handlers
  const handleCreatePost = async (params: { title: string; content: string; tag: PostTag }) => {
    if (!user || !profile) return;
    const res = await createCommunityPost(user, profile, params);
    if (res.post) {
      setPosts((prev) => [res.post!, ...prev]);
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!user) return;
    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = !p.is_liked_by_me;
          return {
            ...p,
            is_liked_by_me: isLiked,
            likes_count: isLiked ? p.likes_count + 1 : Math.max(0, p.likes_count - 1),
          };
        }
        return p;
      })
    );

    const result = await togglePostLike(postId, user.id);
    if (!result.error) {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              is_liked_by_me: result.liked,
              likes_count: result.newCount,
            };
          }
          return p;
        })
      );
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    if (!window.confirm("Are you certain you want to strike this dispatch from the realm record?")) {
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    await deleteCommunityPost(postId, user.id);
  };

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen bg-[#FDF8EE] flex flex-col items-center justify-center p-4">
        <div className="p-8 bg-white border-3 border-slate-950 rounded-3xl shadow-[5px_5px_0px_0px_#020617] flex flex-col items-center gap-3 text-center max-w-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#FFEAEF] border-2 border-slate-950 flex items-center justify-center shadow-[2px_2px_0px_0px_#020617] animate-bounce">
            <Shield className="w-6 h-6 text-[#FF6B8B]" />
          </div>
          <p className="font-display font-black text-base text-slate-950">
            Entering Guild Sanctum...
          </p>
          <span className="text-xs font-bold text-slate-500">
            Synchronizing realm dispatches
          </span>
        </div>
      </div>
    );
  }

  const avatarEmoji = AVATAR_EMOJIS[profile.avatar_class] || "🥊";

  return (
    <div className="min-h-screen bg-[#FDF8EE] text-slate-900 flex flex-col font-sans pb-16">
      {/* Top Navbar: Floating Pill with Glassmorphism */}
      <header className="sticky top-3 sm:top-4 z-40 max-w-7xl mx-auto px-4 sm:px-6 w-full pointer-events-none mb-6 sm:mb-8">
        <div className="relative pointer-events-auto">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-2 -top-2 -bottom-5 rounded-full backdrop-blur-[6px] [mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)] -z-10"
          />

          <nav className="bg-white/75 backdrop-blur-xl border-3 border-slate-950 rounded-full px-3.5 sm:px-6 py-2.5 shadow-[4px_4px_0px_0px_#020617] ring-1 ring-white/80 flex items-center justify-between gap-3 transition-all">
            {/* Left Brand & Return */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-xs font-display font-black px-3.5 py-1.5 bg-[#FDF8EE] hover:bg-[#FFEAEF] border-2 border-slate-950 rounded-full shadow-[2px_2px_0px_0px_#020617] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </Link>
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-[#E8FAF5] text-emerald-950 border-2 border-slate-950 rounded-full text-xs font-display font-black shadow-[1px_1px_0px_0px_#020617]">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Guild Sanctum</span>
              </div>
            </div>

            {/* Right Adventurer Stats */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full border-2 border-slate-950 text-xs font-display font-black shadow-[1px_1px_0px_0px_#020617] ${
                  profile.streak_days > 0 ? "bg-[#FFF0E6] text-[#FF5722]" : "bg-slate-100 text-slate-500"
                }`}
              >
                <Flame
                  className={`w-3.5 h-3.5 ${
                    profile.streak_days > 0 ? "fill-[#FF5722] text-[#FF5722]" : "text-slate-400"
                  }`}
                />
                <span>{profile.streak_days}d Streak</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 bg-[#FFF9DB] text-[#B45309] rounded-full border-2 border-slate-950 text-xs font-display font-black shadow-[1px_1px_0px_0px_#020617]">
                <Coins className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>{profile.gold} Gold</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#FFEAEF] border-2 border-slate-950 flex items-center justify-center text-sm shadow-[1.5px_1.5px_0px_0px_#020617]">
                {avatarEmoji}
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Container with 30% / 70% Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 lg:gap-8 items-start">
          
          {/* ========================================================= */}
          {/* LEFT PANEL: 30% WIDTH (lg:col-span-3)                    */}
          {/* ========================================================= */}
          <aside className="lg:col-span-3 space-y-5 lg:sticky lg:top-24">
            
            {/* Action 1: Create New Post Button / Card */}
            <div className="bg-[#FFEAEF] border-3 border-slate-950 rounded-3xl p-5 shadow-[5px_5px_0px_0px_#020617] relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 bg-white border-2 border-slate-950 rounded-full text-[10px] font-display font-black text-[#FF6B8B] shadow-[1px_1px_0px_0px_#020617]">
                  Tavern Board
                </span>
                <span className="text-xl">📜</span>
              </div>
              <h2 className="font-display font-black text-lg text-slate-950 leading-tight">
                Share With Guild
              </h2>
              <p className="text-xs font-bold text-slate-600 mt-1 mb-4 leading-relaxed">
                Log a milestone, discuss strategies, or share habit tactics with Markdown formatting.
              </p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full py-2.5 px-4 bg-[#FF6B8B] hover:bg-[#ff5277] text-white font-display font-black text-xs sm:text-sm rounded-2xl border-2 border-slate-950 shadow-[3px_3px_0px_0px_#020617] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <PenLine className="w-4 h-4" />
                <span>Forge New Post</span>
              </button>
            </div>

            {/* Action 2: View Filter Toggle (All Posts vs My Posts) */}
            <div className="bg-white border-3 border-slate-950 rounded-3xl p-4 sm:p-5 shadow-[5px_5px_0px_0px_#020617]">
              <h3 className="font-display font-black text-xs uppercase tracking-wider text-slate-500 mb-3">
                Feed Channels
              </h3>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setViewFilter("all")}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-2xl border-2 border-slate-950 text-xs font-display font-black transition-all cursor-pointer ${
                    viewFilter === "all"
                      ? "bg-[#DCEBFE] text-blue-950 shadow-[2px_2px_0px_0px_#020617]"
                      : "bg-[#FDF8EE] text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>🌍</span>
                    <span>All Realm Posts</span>
                  </div>
                  <span className="px-2 py-0.5 bg-white border border-slate-950 rounded-full text-[10px]">
                    {posts.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewFilter("my_posts")}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-2xl border-2 border-slate-950 text-xs font-display font-black transition-all cursor-pointer ${
                    viewFilter === "my_posts"
                      ? "bg-[#FFEAEF] text-[#FF6B8B] shadow-[2px_2px_0px_0px_#020617]"
                      : "bg-[#FDF8EE] text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>🛡️</span>
                    <span>My Posts Only</span>
                  </div>
                  <span className="px-2 py-0.5 bg-white border border-slate-950 rounded-full text-[10px]">
                    {myPosts.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Action 3: Top 3 Latest Posts of Current User */}
            <div className="bg-white border-3 border-slate-950 rounded-3xl p-4 sm:p-5 shadow-[5px_5px_0px_0px_#020617]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-black text-xs uppercase tracking-wider text-slate-950 flex items-center gap-1.5">
                  <span>⚔️</span>
                  <span>My Latest 3 Posts</span>
                </h3>
                {myPosts.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setViewFilter("my_posts")}
                    className="text-[10px] font-display font-black text-[#FF6B8B] hover:underline cursor-pointer"
                  >
                    View All ({myPosts.length})
                  </button>
                )}
              </div>

              {myTopThreePosts.length === 0 ? (
                <div className="p-4 bg-[#FDF8EE] border-2 border-dashed border-slate-300 rounded-2xl text-center">
                  <p className="text-xs font-display font-black text-slate-700">
                    No posts available
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {myTopThreePosts.map((myPost, idx) => (
                    <div
                      key={myPost.id}
                      onClick={() => {
                        setViewFilter("my_posts");
                        setSearchQuery("");
                      }}
                      className="p-3 bg-[#FDF8EE] hover:bg-[#FFEAEF]/40 border-2 border-slate-950 rounded-2xl shadow-[2px_2px_0px_0px_#020617] transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[9px] font-display font-black uppercase px-2 py-0.2 bg-white border border-slate-950 rounded-full text-slate-700">
                          {myPost.tag}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {new Date(myPost.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <h4 className="font-display font-black text-xs text-slate-950 line-clamp-1 group-hover:text-[#FF6B8B] transition-colors">
                        {myPost.title || myPost.content}
                      </h4>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] font-bold text-slate-500">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-[#FF6B8B]" />
                          {myPost.likes_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-blue-500" />
                          {myPost.comments_count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profile Dossier Widget */}
            <div className="p-4 bg-[#E8FAF5] border-3 border-slate-950 rounded-3xl shadow-[5px_5px_0px_0px_#020617] flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-950 flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_#020617]">
                {avatarEmoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-display font-black text-xs sm:text-sm text-slate-950 truncate">
                    {profile.full_name || profile.username}
                  </h4>
                  <span className="px-1.5 py-0.2 bg-[#FFD166] text-slate-950 border border-slate-950 rounded text-[9px] font-display font-black shrink-0">
                    Lv. {profile.level}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-500 truncate">
                  @{profile.username} • {profile.avatar_class}
                </p>
              </div>
            </div>

          </aside>

          {/* ========================================================= */}
          {/* RIGHT PANEL: 70% WIDTH (lg:col-span-7)                   */}
          {/* ========================================================= */}
          <section className="lg:col-span-7 space-y-6">
            
            {/* Feed Control Bar: Search, Tags, Sort */}
            <div className="bg-white border-3 border-slate-950 rounded-3xl p-4 sm:p-5 shadow-[5px_5px_0px_0px_#020617] space-y-3.5">
              
              {/* Search input & Active Filter label */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search dispatches, lore, authors..."
                    className="w-full pl-9 pr-4 py-2 bg-[#FDF8EE] border-2 border-slate-950 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B8B]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-800"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Sort selector */}
                <div className="flex items-center gap-1 self-end sm:self-auto bg-[#FDF8EE] p-1 rounded-2xl border-2 border-slate-950 shadow-[1.5px_1.5px_0px_0px_#020617]">
                  <button
                    type="button"
                    onClick={() => setSortBy("latest")}
                    className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-display font-black transition-all cursor-pointer ${
                      sortBy === "latest"
                        ? "bg-white text-slate-950 border border-slate-950 shadow-[1px_1px_0px_0px_#020617]"
                        : "text-slate-600 hover:text-slate-950"
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>Latest</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy("likes")}
                    className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-display font-black transition-all cursor-pointer ${
                      sortBy === "likes"
                        ? "bg-white text-[#FF6B8B] border border-slate-950 shadow-[1px_1px_0px_0px_#020617]"
                        : "text-slate-600 hover:text-slate-950"
                    }`}
                  >
                    <TrendingUp className="w-3 h-3" />
                    <span>Top Liked</span>
                  </button>
                </div>
              </div>

              {/* Tag Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar-none">
                {["ALL", "Discussion", "Strategy", "Milestone", "Accountability", "Lore", "Victory"].map((tag) => {
                  const isSelected = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(tag)}
                      className={`px-3 py-1 rounded-full text-xs font-display font-black whitespace-nowrap border-2 border-slate-950 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-slate-950 text-white shadow-[2px_2px_0px_0px_#020617]"
                          : "bg-[#FDF8EE] text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {tag === "ALL" ? "All Tags" : tag}
                    </button>
                  );
                })}
              </div>

              {/* Active Filter Indicator */}
              {viewFilter === "my_posts" && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#FFEAEF] border-2 border-slate-950 rounded-2xl text-xs font-display font-black text-[#FF6B8B]">
                  <span>Showing posts by you (@{profile.username})</span>
                  <button
                    type="button"
                    onClick={() => setViewFilter("all")}
                    className="underline hover:opacity-80 cursor-pointer"
                  >
                    Show all guild posts
                  </button>
                </div>
              )}
            </div>

            {/* Posts Stream */}
            {loadingPosts ? (
              <div className="py-16 text-center bg-white border-3 border-slate-950 rounded-3xl p-8 shadow-[5px_5px_0px_0px_#020617]">
                <div className="w-10 h-10 mx-auto rounded-2xl bg-[#FFEAEF] border-2 border-slate-950 flex items-center justify-center shadow-[2px_2px_0px_0px_#020617] animate-spin mb-3">
                  <Sparkles className="w-5 h-5 text-[#FF6B8B]" />
                </div>
                <p className="font-display font-black text-sm text-slate-950">
                  Gathering guild dispatches...
                </p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="py-16 text-center bg-white border-3 border-slate-950 rounded-3xl p-8 shadow-[5px_5px_0px_0px_#020617]">
                <div className="text-4xl mb-3">📭</div>
                <h3 className="font-display font-black text-lg text-slate-950">
                  No posts available
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-[#FF6B8B] hover:bg-[#ff5277] text-white font-display font-black text-xs rounded-2xl border-2 border-slate-950 shadow-[2px_2px_0px_0px_#020617] active:translate-x-[1px] active:translate-y-[1px] transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Forge New Post</span>
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={user.id}
                    currentUserProfile={profile}
                    onToggleLike={handleToggleLike}
                    onDeletePost={handleDeletePost}
                  />
                ))}
              </div>
            )}

          </section>

        </div>
      </main>

      {/* Post Creation Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePost}
        currentUserName={profile.full_name || profile.username}
      />
    </div>
  );
}
