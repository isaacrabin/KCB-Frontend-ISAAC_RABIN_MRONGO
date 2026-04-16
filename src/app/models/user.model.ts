export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  role?: 'admin' | 'editor' | 'viewer';
  status?: 'active' | 'inactive' | 'pending';
  department?: string;
  lastLogin?: string;
  createdAt?: string;
}
