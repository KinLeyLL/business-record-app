export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'OWNER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}