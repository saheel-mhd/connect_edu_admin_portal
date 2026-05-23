export type UserRole =
  | 'KID'
  | 'PARENT'
  | 'MENTOR'
  | 'ORGANIZATION'
  | 'ADMIN'
  | 'SUPER_ADMIN';

export type UserStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'BANNED'
  | 'DELETED';

export interface AdminUser {
  id: string;
  role: UserRole;
  status: UserStatus;
  email: string | null;
  phone?: string | null;
  name: string;
  username?: string | null;
  avatarUrl?: string | null;
  country?: string | null;
  language?: string | null;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
}
