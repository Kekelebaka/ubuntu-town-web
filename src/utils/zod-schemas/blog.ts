import { z } from 'zod';

// Stub: Blog features not yet migrated to Ubuntu Town OS v1
// These types exist to satisfy the build. Replace when blog is added.

type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  author_id: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  body: string;
};

type BlogPostCommentRow = {
  id: string;
  blog_post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
};

export const blogCommentSchema = z.object({
  postId: z.string().uuid(),
  slug: z.string().min(1),
  body: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment cannot exceed 2000 characters'),
});

export type BlogCommentInput = z.infer<typeof blogCommentSchema>;

export interface BlogPostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  authorId: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
}

export interface BlogPostDetail extends BlogPostSummary {
  body: string;
}

export interface BlogPostComment {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}
