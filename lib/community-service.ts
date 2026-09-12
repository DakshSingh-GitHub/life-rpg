import { createClient } from "./supabase/client";
import { CommunityPost, CommunityComment } from "./types/community";
import { UserProfile } from "./types/rpg";

// Service Methods - Pure Supabase (Zero mock data)

export async function getCommunityPosts(
  currentUserId?: string
): Promise<CommunityPost[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      profiles:user_id (
        username,
        full_name,
        avatar_class,
        level
      )
    `)
    .order("created_at", { ascending: false });

  if (error || !data) {
    if (error) {
      console.error("Supabase getCommunityPosts error:", error);
    }
    return [];
  }

  let likedPostIds = new Set<string>();
  if (currentUserId && data.length > 0) {
    const { data: likesData } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", currentUserId);

    if (likesData) {
      likedPostIds = new Set(likesData.map((l: { post_id: string }) => l.post_id));
    }
  }

  const formattedPosts: CommunityPost[] = data.map((item: any) => {
    const profile = item.profiles || {};
    return {
      id: item.id,
      user_id: item.user_id,
      title: item.title,
      content: item.content,
      tag: item.tag || "Discussion",
      likes_count: item.likes_count ?? 0,
      comments_count: item.comments_count ?? 0,
      created_at: item.created_at,
      updated_at: item.updated_at,
      author_name: profile.full_name || profile.username || "Adventurer",
      author_username: profile.username || "adventurer",
      author_avatar_class: profile.avatar_class || "warrior",
      author_level: profile.level || 1,
      is_liked_by_me: currentUserId ? likedPostIds.has(item.id) : false,
    };
  });

  return formattedPosts;
}

export async function createCommunityPost(
  user: { id: string },
  profile: UserProfile,
  params: { title: string; content: string; tag: string }
): Promise<{ post?: CommunityPost; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      title: params.title.trim(),
      content: params.content.trim(),
      tag: params.tag || "Discussion",
    })
    .select(`
      *,
      profiles:user_id (
        username,
        full_name,
        avatar_class,
        level
      )
    `)
    .single();

  if (error) {
    console.error("Supabase createCommunityPost error:", error);
    return { error: error.message };
  }

  const p = data.profiles || profile;
  const newPost: CommunityPost = {
    id: data.id,
    user_id: data.user_id,
    title: data.title,
    content: data.content,
    tag: data.tag,
    likes_count: data.likes_count ?? 0,
    comments_count: data.comments_count ?? 0,
    created_at: data.created_at,
    updated_at: data.updated_at,
    author_name: p.full_name || p.username || "Adventurer",
    author_username: p.username || "adventurer",
    author_avatar_class: p.avatar_class || "warrior",
    author_level: p.level || 1,
    is_liked_by_me: false,
  };

  return { post: newPost };
}

export async function deleteCommunityPost(
  postId: string,
  userId: string
): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", userId);

  if (error) {
    console.error("Supabase deleteCommunityPost error:", error);
    return { error: error.message };
  }
  return {};
}

export async function togglePostLike(
  postId: string,
  userId: string
): Promise<{ liked: boolean; newCount: number; error?: string }> {
  const supabase = createClient();
  const { data: existingLike } = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingLike) {
    // Unlike
    await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);

    const { data: postData } = await supabase
      .from("posts")
      .select("likes_count")
      .eq("id", postId)
      .single();

    return {
      liked: false,
      newCount: postData?.likes_count ?? 0,
    };
  } else {
    // Like
    await supabase
      .from("post_likes")
      .insert({ post_id: postId, user_id: userId });

    const { data: postData } = await supabase
      .from("posts")
      .select("likes_count")
      .eq("id", postId)
      .single();

    return {
      liked: true,
      newCount: postData?.likes_count ?? 1,
    };
  }
}

// Build nested tree from flat comments list
export function buildCommentTree(comments: CommunityComment[]): CommunityComment[] {
  const map = new Map<string, CommunityComment>();
  const roots: CommunityComment[] = [];

  comments.forEach((c) => {
    map.set(c.id, { ...c, replies: [] });
  });

  comments.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.replies!.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export async function getPostComments(postId: string): Promise<CommunityComment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("comments")
    .select(`
      *,
      profiles:user_id (
        username,
        full_name,
        avatar_class,
        level
      )
    `)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    if (error) {
      console.error("Supabase getPostComments error:", error);
    }
    return [];
  }

  const flatComments: CommunityComment[] = data.map((c: any) => {
    const profile = c.profiles || {};
    return {
      id: c.id,
      post_id: c.post_id,
      user_id: c.user_id,
      parent_id: c.parent_id,
      content: c.content,
      likes_count: c.likes_count ?? 0,
      created_at: c.created_at,
      updated_at: c.updated_at,
      author_name: profile.full_name || profile.username || "Adventurer",
      author_username: profile.username || "adventurer",
      author_avatar_class: profile.avatar_class || "warrior",
      author_level: profile.level || 1,
    };
  });

  return buildCommentTree(flatComments);
}

export async function addComment(
  user: { id: string },
  profile: UserProfile,
  params: { postId: string; parentId?: string | null; content: string }
): Promise<{ comment?: CommunityComment; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: params.postId,
      user_id: user.id,
      parent_id: params.parentId || null,
      content: params.content.trim(),
    })
    .select(`
      *,
      profiles:user_id (
        username,
        full_name,
        avatar_class,
        level
      )
    `)
    .single();

  if (error) {
    console.error("Supabase addComment error:", error);
    return { error: error.message };
  }

  const p = data.profiles || profile;
  const newComment: CommunityComment = {
    id: data.id,
    post_id: data.post_id,
    user_id: data.user_id,
    parent_id: data.parent_id,
    content: data.content,
    likes_count: data.likes_count ?? 0,
    created_at: data.created_at,
    author_name: p.full_name || p.username || "Adventurer",
    author_username: p.username || "adventurer",
    author_avatar_class: p.avatar_class || "warrior",
    author_level: p.level || 1,
    replies: [],
  };

  return { comment: newComment };
}

export async function deleteComment(
  commentId: string,
  userId: string,
  _postId: string
): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", userId);

  if (error) {
    console.error("Supabase deleteComment error:", error);
    return { error: error.message };
  }
  return {};
}
