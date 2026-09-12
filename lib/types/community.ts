export type PostTag =
  | "Discussion"
  | "Milestone"
  | "Strategy"
  | "Accountability"
  | "Lore"
  | "Victory";

export interface CommunityPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tag: PostTag | string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at?: string;
  author_name: string;
  author_username: string;
  author_avatar_class: string;
  author_level: number;
  is_liked_by_me?: boolean;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at?: string;
  author_name: string;
  author_username: string;
  author_avatar_class: string;
  author_level: number;
  replies?: CommunityComment[];
}
