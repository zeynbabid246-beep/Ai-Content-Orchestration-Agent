export type UserRole = "owner" | "admin" | "editor" | "viewer";

export interface User {
  id: string;
  email: string;
  displayName: string;
  roles: UserRole[];
}
