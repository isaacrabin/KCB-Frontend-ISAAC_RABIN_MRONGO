import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'token';
  token = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));
  isAuthenticated = computed(() => !!this.token());

  login(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.token.set(token);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.token.set(null);
  }

  getToken(): string | null {
    return this.token();
  }
}
