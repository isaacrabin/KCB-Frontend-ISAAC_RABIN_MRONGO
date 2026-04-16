import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { of, delay, throwError } from 'rxjs';
import { User } from '../../models/user.model';
import { AuthModel } from '../../models/auth.model';

let users: User[] = [
  { id: 1, name: 'John Doe', phone: '', username: 'john', email: 'john@test.com' },
  { id: 2, name: 'Jane Smith', phone: '', username: 'jane', email: 'jane@test.com' }
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

    if (username === 'admin' && password === 'admin') {
      return ok({ token: 'fake-jwt-token' });
    }

    return error(401, 'Invalid credentials');
  }

  if (!headers.get('Authorization')) {
    return error(401, 'Unauthorized');
  }


  if (url.endsWith('/users') && method === 'GET') {
    return ok(users);
  }

  if (url.endsWith('/users') && method === 'POST') {
    const newUser: User = {
      ...body as User,
      id: Date.now()
    };

    users.push(newUser);
    return ok(newUser);
  }

  if (/\/users\/\d+$/.test(url) && method === 'PUT') {
    const id = Number(url.split('/').pop());

    users = users.map(u =>
      u.id === id ? { ...u, ...body as User, id } : u
    );

    const updatedUser = users.find(u => u.id === id);
    return ok(updatedUser);
  }

  if (/\/users\/\d+$/.test(url) && method === 'DELETE') {
    const id = Number(url.split('/').pop());
    users = users.filter(u => u.id !== id);

    return ok({ message: 'User deleted' });
  }

  return next(req);
};
