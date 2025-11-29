/**
 * Course types - 课程相关类型定义
 */

export type CourseStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Course {
  id: number;
  title: string;
  description?: string;
  cover_image?: string;
  status: CourseStatus;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  likes_count: number;
  views_count: number;
  fail_reason?: string;
  content?: any;
}

export interface Message {
  id: number;
  title: string;
  content: string;
  message_type: 'system' | 'animation_success' | 'animation_failed' | 'credits_reward';
  is_read: boolean;
  related_course_id?: number;
  created_at: string;
  read_at?: string;
}

export interface CourseListResponse {
  courses: Course[];
  total: number;
  page: number;
  page_size: number;
}
