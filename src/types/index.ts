export type UserRole = 'student' | 'club_admin' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  department: string;
  role?: UserRole;
  is_admin?: boolean;
  avatar_url?: string;
  bio?: string;
  year?: number;
  reg_number?: string;
  created_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  image_url?: string;
  is_pinned: boolean;
  club_name?: string;
  club_id?: string | { id?: string; _id?: string; name?: string };
  club?: { id?: string; _id?: string; name?: string };
  likes_count: number;
  comments_count: number;
  likes?: string[];
  comments?: PostComment[];
  created_at: string;
  author?: User;
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: User;
}

export interface LostAndFoundItem {
  id: string;
  title: string;
  description: string;
  category?: string;
  location: string;
  image_url?: string;
  type: 'lost' | 'found';
  status: 'active' | 'resolved';
  user_id: string;
  contact_info?: string;
  created_at: string;
  user?: User;
}

export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition?: 'new' | 'like_new' | 'good' | 'fair';
  department?: string;
  image_url?: string;
  seller_id?: string;
  user_id?: string;
  status: 'available' | 'sold' | 'reserved';
  created_at: string;
  seller?: User;
  user?: User;
}

export interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  created_at: string;
  other_user?: User;
  last_message?: Message | string;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'message' | 'announcement' | 'marketplace' | 'lost_found';
  title: string;
  content: string;
  reference_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface UserReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  reported_user?: User;
}

export interface Club {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  category: string;
  admin_id?: string;
  members_count: number;
  created_at: string;
}

export interface ClubMembership {
  id: string;
  club_id: string;
  user_id: string;
  role: 'member' | 'moderator' | 'admin';
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  image_url?: string;
  attendees_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: User;
}

export interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  totalLostFound: number;
  totalMarketplace: number;
  totalClubs: number;
  recentUsers: User[];
}
