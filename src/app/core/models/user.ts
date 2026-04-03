import { UserRole } from './enums';

export interface ObfuscatedUser {
  userId: string;
  role: UserRole;
}

export interface BaseUser extends ObfuscatedUser {
  username: string;
  email: string;
}

export interface ViewUser extends BaseUser {
  lastAccess: string | null;
}

export interface CreatedUser extends BaseUser {
  createdAt: string;
}

export interface UpdatedUser extends BaseUser {
  updatedAt: string;
}

export interface UserParameters {
  username: string;
  email: string;
  role: UserRole;
  password: string;
}

export interface UpdateUserParameters {
  username?: string;
  email?: string;
  role?: UserRole;
}

export interface DeleteUserFeedback {
  deleted: number;
  failed?: string[];
}
