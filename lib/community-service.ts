import { createClient, isSupabaseConfigured } from "./supabase/client";
import { CommunityPost, CommunityComment } from "./types/community";
import { UserProfile } from "./types/rpg";

const LOCAL_POSTS_KEY = "life_rpg_community_posts";
const LOCAL_COMMENTS_KEY = "life_rpg_community_comments";
const LOCAL_LIKES_KEY = "life_rpg_community_likes";

// Default Seed Posts for when local storage is empty or Supabase tables are being initialized
const SEED_POSTS: CommunityPost[] = [
  {
    id: "seed-post-1",
    user_id: "adventurer-valkyrie",
    title: "⚔️ The 21-Day Habit Forge: How I scaled Swiftness to Lv. 14",
    content: `Greetings fellow guild members! 

I used to abandon my morning workout and study routines by day 4. Here is the **RPG skill tree system** that turned it into an unshakeable habit:

### 🎯 The Triple-Quest Rule
1. **Never skip 2 days in a row**: If HP is low, do a mini-version (e.g. *10 pushups* instead of 40).
2. **Anchor with existing habits**: Drink 500ml water right before morning coffee.
3. **Reward yourself immediately**:
   > *"True mastery is not a solitary leap, but a thousand daily steps counted in Gold."*

\`\`\`markdown
[Streak Status]: 21 Days ⚡
[Brawn XP]: +420 XP
[Intellect XP]: +350 XP
\`\`\`

Give this a spin on your next quest cycle! What's everyone's current longest streak?`,
    tag: "Strategy",
    likes_count: 14,
    comments_count: 3,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    author_name: "Elena Dawnseeker",
    author_username: "dawnseeker",
    author_avatar_class: "rogue",
    author_level: 14,
    is_liked_by_me: false,
  },
  {
    id: "seed-post-2",
    user_id: "adventurer-gandalf",
    title: "🧠 Defeating the 'Afternoon Slump Demon' with Deep Work Pomodoros",
    content: `Every day around 2:30 PM, my energy would plummet and procrastination would ambush my productivity.

Here is the tactical spell loadout that fixed it:
- **Phase 1: Cold Splash & 10 Jumping Jacks** (Triggers *Vitality Surge*)
- **Phase 2: 25-minute Pomodoro Sprint** with zero tabs open
- **Phase 3: Reward with 5m herbal tea**

Who else struggles with afternoon focus? Share your counter-spells below!`,
    tag: "Discussion",
    likes_count: 9,
    comments_count: 2,
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    author_name: "Master Alistair",
    author_username: "alistair_mage",
    author_avatar_class: "mage",
    author_level: 19,
    is_liked_by_me: true,
  },
  {
    id: "seed-post-3",
    user_id: "adventurer-thor",
    title: "🏆 Milestone Unlocked: 30-Day Streak & Claimed Guild Champion Badge!",
    content: `Started as a humble Lv. 1 Recruit on this realm. Today, I officially hit **Day 30 without breaking the streak**! 

Saved up enough Gold from daily quests to unlock the *Mythic Guild Champion Badge* in the Armory. 👑

**Key takeaway**: Start small. Don't set 10 impossible quests. Master 3 simple daily habits first, then level up difficulty. Onward to Day 60!`,
    tag: "Milestone",
    likes_count: 27,
    comments_count: 4,
    created_at: new Date(Date.now() - 3600000 * 32).toISOString(),
    author_name: "Kaelen Stonehammer",
    author_username: "stonehammer",
    author_avatar_class: "warrior",
    author_level: 22,
    is_liked_by_me: false,
  },
];

const SEED_COMMENTS: CommunityComment[] = [
  {
    id: "seed-comment-1",
    post_id: "seed-post-1",
    user_id: "adventurer-gandalf",
    parent_id: null,
    content: "Awesome advice! The mini-version rule is essentially the *Atomic Habits* 2-minute rule adapted for RPGs. Works wonders when motivation is low.",
    likes_count: 4,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    author_name: "Master Alistair",
    author_username: "alistair_mage",
    author_avatar_class: "mage",
    author_level: 19,
  },
  {
    id: "seed-comment-2",
    post_id: "seed-post-1",
    user_id: "adventurer-valkyrie",
    parent_id: "seed-comment-1",
    content: "Exactly! Keeping the streak flame burning even with 5 minutes is 10x better than restarting from zero.",
    likes_count: 2,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    author_name: "Elena Dawnseeker",
    author_username: "dawnseeker",
    author_avatar_class: "rogue",
    author_level: 14,
  },
  {
    id: "seed-comment-3",
    post_id: "seed-post-1",
    user_id: "adventurer-thor",
    parent_id: "seed-comment-2",
    content: "Agreed! Nothing hurts more than seeing that flame counter reset to 0. Protect the streak at all costs! 🔥",
    likes_count: 3,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    author_name: "Kaelen Stonehammer",
    author_username: "stonehammer",
    author_avatar_class: "warrior",
    author_level: 22,
  },
  {
    id: "seed-comment-4",
    post_id: "seed-post-2",
    user_id: "adventurer-thor",
    parent_id: null,
    content: "I do 15 bodyweight squats instead of jumping jacks. Gets the blood pumping to the brain in seconds.",
    likes_count: 3,
    created_at: new Date(Date.now() - 3600000 * 16).toISOString(),
    author_name: "Kaelen Stonehammer",
    author_username: "stonehammer",
    author_avatar_class: "warrior",
    author_level: 22,
  },
  {
    id: "seed-comment-5",
    post_id: "seed-post-2",
    user_id: "adventurer-gandalf",
    parent_id: "seed-comment-4",
    content: "Squats are great! Anything that breaks static sitting immediately resets energy levels.",
    likes_count: 1,
    created_at: new Date(Date.now() - 3600000 * 15).toISOString(),
    author_name: "Master Alistair",
    author_username: "alistair_mage",
    author_avatar_class: "mage",
    author_level: 19,
  },
];

// Local Storage Helpers
function getLocalPosts(): CommunityPost[] {
  if (typeof window === "undefined") return SEED_POSTS;
  try {
    const raw = localStorage.getItem(LOCAL_POSTS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(SEED_POSTS));
      return SEED_POSTS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_POSTS;
  }
}

function saveLocalPosts(posts: CommunityPost[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(posts));
  } catch (err) {
    console.warn("Error saving community posts to local storage", err);
  }
}

function getLocalComments(): CommunityComment[] {
  if (typeof window === "undefined") return SEED_COMMENTS;
  try {
    const raw = localStorage.getItem(LOCAL_COMMENTS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(SEED_COMMENTS));
      return SEED_COMMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_COMMENTS;
  }
}

function saveLocalComments(comments: CommunityComment[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(comments));
  } catch (err) {
    console.warn("Error saving community comments to local storage", err);
  }
}

function getLocalLikes(userId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(`${LOCAL_LIKES_KEY}_${userId}`);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function saveLocalLikes(userId: string, likedPostIds: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${LOCAL_LIKES_KEY}_${userId}`,
      JSON.stringify(Array.from(likedPostIds))
    );
  } catch (err) {
    console.warn("Error saving community likes to local storage", err);
  }
}

// Service Methods
export async function getCommunityPosts(
  currentUserId?: string
): Promise<CommunityPost[]> {
  if (isSupabaseConfigured()) {
    try {
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

      if (!error && data) {
        let likedPostIds = new Set<string>();
        if (currentUserId) {
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

        // If remote database is initialized and has posts, return them
        if (formattedPosts.length > 0) {
          return formattedPosts;
        }
      }
    } catch (err) {
      console.warn("Supabase fetch failed, using local storage fallback", err);
    }
  }

  // Fallback to local storage
  const localPosts = getLocalPosts();
  const likedPostIds = currentUserId ? getLocalLikes(currentUserId) : new Set<string>();

  return localPosts.map((post) => ({
    ...post,
    is_liked_by_me: likedPostIds.has(post.id),
  }));
}

export async function createCommunityPost(
  user: { id: string },
  profile: UserProfile,
  params: { title: string; content: string; tag: string }
): Promise<{ post?: CommunityPost; error?: string }> {
  if (isSupabaseConfigured()) {
    try {
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

      if (!error && data) {
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
    } catch (err: any) {
      console.warn("Supabase post insert failed, using local fallback", err);
    }
  }

  // Local fallback
  const newLocalPost: CommunityPost = {
    id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    user_id: user.id,
    title: params.title.trim(),
    content: params.content.trim(),
    tag: params.tag || "Discussion",
    likes_count: 0,
    comments_count: 0,
    created_at: new Date().toISOString(),
    author_name: profile.full_name || profile.username || "Adventurer",
    author_username: profile.username || "adventurer",
    author_avatar_class: profile.avatar_class || "warrior",
    author_level: profile.level || 1,
    is_liked_by_me: false,
  };

  const currentPosts = getLocalPosts();
  saveLocalPosts([newLocalPost, ...currentPosts]);
  return { post: newLocalPost };
}

export async function deleteCommunityPost(
  postId: string,
  userId: string
): Promise<{ error?: string }> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", userId);
      if (!error) {
        return {};
      }
    } catch (err: any) {
      console.warn("Supabase post delete failed, fallback", err);
    }
  }

  const posts = getLocalPosts().filter((p) => p.id !== postId);
  saveLocalPosts(posts);
  const comments = getLocalComments().filter((c) => c.post_id !== postId);
  saveLocalComments(comments);
  return {};
}

export async function togglePostLike(
  postId: string,
  userId: string
): Promise<{ liked: boolean; newCount: number; error?: string }> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      // Check if user already liked
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
    } catch (err: any) {
      console.warn("Supabase toggle like failed, using local fallback", err);
    }
  }

  // Local fallback
  const likedPostIds = getLocalLikes(userId);
  const posts = getLocalPosts();
  const post = posts.find((p) => p.id === postId);

  if (!post) {
    return { liked: false, newCount: 0, error: "Post not found" };
  }

  let liked = false;
  if (likedPostIds.has(postId)) {
    likedPostIds.delete(postId);
    post.likes_count = Math.max(0, post.likes_count - 1);
    liked = false;
  } else {
    likedPostIds.add(postId);
    post.likes_count += 1;
    liked = true;
  }

  saveLocalLikes(userId, likedPostIds);
  saveLocalPosts(posts);
  return { liked, newCount: post.likes_count };
}

// Build nested tree from flat comments list
export function buildCommentTree(comments: CommunityComment[]): CommunityComment[] {
  const map = new Map<string, CommunityComment>();
  const roots: CommunityComment[] = [];

  // Deep clone to avoid mutating input objects
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
  if (isSupabaseConfigured()) {
    try {
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

      if (!error && data) {
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
    } catch (err) {
      console.warn("Supabase comments fetch failed, using fallback", err);
    }
  }

  // Local fallback
  const allComments = getLocalComments().filter((c) => c.post_id === postId);
  return buildCommentTree(allComments);
}

export async function addComment(
  user: { id: string },
  profile: UserProfile,
  params: { postId: string; parentId?: string | null; content: string }
): Promise<{ comment?: CommunityComment; error?: string }> {
  if (isSupabaseConfigured()) {
    try {
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

      if (!error && data) {
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
    } catch (err: any) {
      console.warn("Supabase add comment failed, using local fallback", err);
    }
  }

  // Local fallback
  const newComment: CommunityComment = {
    id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    post_id: params.postId,
    user_id: user.id,
    parent_id: params.parentId || null,
    content: params.content.trim(),
    likes_count: 0,
    created_at: new Date().toISOString(),
    author_name: profile.full_name || profile.username || "Adventurer",
    author_username: profile.username || "adventurer",
    author_avatar_class: profile.avatar_class || "warrior",
    author_level: profile.level || 1,
    replies: [],
  };

  const allComments = getLocalComments();
  saveLocalComments([...allComments, newComment]);

  // Increment comments_count on local post
  const posts = getLocalPosts();
  const post = posts.find((p) => p.id === params.postId);
  if (post) {
    post.comments_count = (post.comments_count || 0) + 1;
    saveLocalPosts(posts);
  }

  return { comment: newComment };
}

export async function deleteComment(
  commentId: string,
  userId: string,
  postId: string
): Promise<{ error?: string }> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", userId);
      if (!error) return {};
    } catch (err: any) {
      console.warn("Supabase delete comment failed, fallback", err);
    }
  }

  // Local fallback (removes comment and any descendants)
  let comments = getLocalComments();
  const idsToRemove = new Set<string>([commentId]);
  let addedMore = true;
  while (addedMore) {
    addedMore = false;
    comments.forEach((c) => {
      if (c.parent_id && idsToRemove.has(c.parent_id) && !idsToRemove.has(c.id)) {
        idsToRemove.add(c.id);
        addedMore = true;
      }
    });
  }

  comments = comments.filter((c) => !idsToRemove.has(c.id));
  saveLocalComments(comments);

  // Decrement comments count on post
  const posts = getLocalPosts();
  const post = posts.find((p) => p.id === postId);
  if (post) {
    post.comments_count = Math.max(0, (post.comments_count || 0) - idsToRemove.size);
    saveLocalPosts(posts);
  }

  return {};
}
