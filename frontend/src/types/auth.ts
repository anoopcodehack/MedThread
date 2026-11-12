// Available user roles
export type UserRole = "patient" | "caretaker" | "doctor";

// Login form data
export interface LoginData {
  email: string;
  password: string;
}

// Signup form data
export interface SignupData {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}

// User information returned by backend
export interface AuthUser {
  id: number | string;
  fullName: string;
  email: string;
  role: UserRole;
}

// Authentication response
export interface AuthResponse {
  user: AuthUser;
  accessToken?: string;
}