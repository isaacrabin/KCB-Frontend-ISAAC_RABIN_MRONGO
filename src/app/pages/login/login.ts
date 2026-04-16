import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  loading = false;
  errorMessage = '';

  username = new FormControl('', [Validators.required]);

  password = new FormControl('', [
    Validators.required,
    Validators.minLength(4),
  ]);

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private router: Router
  ) {}

  submit() {
    if (this.username.invalid || this.password.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    const payload = {
      username: this.username.value ?? '',
      password: this.password.value ?? '',
    };

    this.http.post<{ token: string }>('/login', payload)
      .subscribe({
        next: (res) => {
          this.auth.login(res.token);
          this.router.navigate(['/users']);
        },
        error: () => {
          this.errorMessage = 'Invalid username or password';
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
  }
}
