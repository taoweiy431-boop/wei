export type Role = 'user' | 'player' | 'csr' | 'admin' | 'super_admin';

export interface Profile {
  id: string; // auth.users.id
  username: string;
  role: Role;
  reputation: number;
  phone?: string;
  status: 'active' | 'suspended' | 'pending';
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'open' | 'claimed' | 'assigned' | 'completed' | 'cancelled';

export interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  expires_at: string | null;
  status: TaskStatus;
  created_by: string | null;
  claimed_by: string | null;
  assigned_to: string | null;
  game_platform_id?: string;
  required_rank?: string;
  priority: number;
  auto_assign: boolean;
  reminder_sent: boolean;
  reminder_count: number;
  created_at: string;
  updated_at: string;
  claimed_at: string | null;
  completed_at: string | null;
}

export interface Claim {
  id: string;
  task_id: string;
  claimer_id: string;
  status: 'claimed' | 'assigned' | 'completed' | 'failed';
  claimed_at: string;
}

export interface Transaction {
  id: string;
  task_id: string;
  worker_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
}

// 新增类型定义 - v2.0

export interface GamePlatform {
  id: string;
  name: string;
  display_name: string;
  icon_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlayerGameAuth {
  id: string;
  player_id: string;
  platform_id: string;
  game_uid: string;
  character_name: string;
  server_region?: string;
  rank_level?: string;
  verification_screenshot?: string;
  status: 'pending' | 'approved' | 'rejected';
  verified_by?: string;
  verified_at?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CSRApplication {
  id: string;
  applicant_id: string;
  real_name: string;
  phone: string;
  experience_years: number;
  previous_experience?: string;
  application_reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DispatchReminder {
  id: string;
  task_id: string;
  player_id: string;
  reminder_type: 'push' | 'sound' | 'sms';
  sent_at: string;
  acknowledged_at?: string;
  status: 'sent' | 'acknowledged' | 'expired';
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'task_dispatch';
  is_read: boolean;
  action_url?: string;
  expires_at?: string;
  created_at: string;
}

export interface PlayerGameInfo {
  id: string;
  player_id: string;
  player_name: string;
  platform_name: string;
  game_uid: string;
  character_name: string;
  server_region?: string;
  rank_level?: string;
  status: string;
  verified_at?: string;
  created_at: string;
}