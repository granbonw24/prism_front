export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  userId: number;
  username: string;
  email: string | null;
  roles: string[];
  permissions: string[];
}

export interface AuthMeResponse {
  userId: number;
  username: string;
  permissions: string[];
}

export interface AuthSession {
  userId: number;
  username: string;
  email?: string | null;
  roles: string[];
  permissions: string[];
}
