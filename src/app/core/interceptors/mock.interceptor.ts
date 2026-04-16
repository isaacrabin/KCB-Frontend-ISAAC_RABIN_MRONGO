import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { of, delay, throwError } from 'rxjs';
import { User } from '../../models/user.model';
import { AuthModel } from '../../models/auth.model';

let users: User[] = [
  { 
    id: 1, 
    name: 'John Doe', 
    username: 'john', 
    email: 'john@test.com', 
    phone: '+1234567890',
    role: 'admin',
    status: 'active',
    department: 'IT',
    lastLogin: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString().split('T')[0]
  },
  { 
    id: 2, 
    name: 'Jane Smith', 
    username: 'jane', 
    email: 'jane@test.com', 
    phone: '+0987654321',
    role: 'viewer',
    status: 'active',
    department: 'HR',
    lastLogin: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString().split('T')[0]
  }
];

const LATENCY = 400;

export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  const { url, method, body, headers } = req;

  const ok = (data?: any) =>
    of(new HttpResponse({ status: 200, body: data })).pipe(delay(LATENCY));

  const error = (status: number, message: string) =>
    throwError(() => new HttpErrorResponse({ status, error: { message } }));

  if (url.endsWith('/login') && method === 'POST') {
    const { username, password }: AuthModel = body as AuthModel;

    if (username === 'admin' && password === 'admin123'|| username === 'user' && password === 'user123') {
      return ok({ token: 'fake-jwt-token' });
    }

    return error(401, 'Invalid credentials');
  }

  const authHeader = headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(401, 'Unauthorized - No valid token provided');
  }

  const token = authHeader.split(' ')[1];
  
  // Validate the token
  if (token !== 'fake-jwt-token') {
    return error(401, 'Unauthorized - Invalid token');
  }

  if (url.endsWith('/users') && method === 'GET') {
    return ok(users);
  }

  if (url.endsWith('/users') && method === 'POST') {
    const newUser: User = {
      ...body as User,
      id: Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: undefined 
    };

    users.push(newUser);
    return ok(newUser);
  }

  if (/\/users\/\d+$/.test(url) && method === 'PUT') {
    const id = Number(url.split('/').pop());
    const updatedData = body as User;

    users = users.map(u =>
      u.id === id ? { ...u, ...updatedData, id } : u
    );

    const updatedUser = users.find(u => u.id === id);
    return ok(updatedUser);
  }

  if (/\/users\/\d+$/.test(url) && method === 'DELETE') {
    const id = Number(url.split('/').pop());
    users = users.filter(u => u.id !== id);

    return ok({ message: 'User deleted successfully' });
  }

  return next(req);
};
