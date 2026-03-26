import { UserRole } from './enums';

export interface ViewUser {
  userId: string;
  name?: string;
  email?: string;
  role: UserRole;
  lastAccess?: string | null;
}

export interface CreatedUser {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface UpdatedUser {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  updatedAt: string;
}

export interface UserParameters {
  name: string;
  email: string;
  role: UserRole;
  password: string;
}

export interface UpdateUserParameters {
  name?: string;
  email?: string;
  role?: UserRole;
}

export interface DeleteUserFeedback {
  deleted: number;
  failed: string[];
}

export interface ObfuscatedUser {
  userId: string;
  role: UserRole;
}
