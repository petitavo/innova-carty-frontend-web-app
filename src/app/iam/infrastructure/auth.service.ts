import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SignInRequest, User } from '../domain/model/user.entity';

const STORAGE_KEY = 'ic-console-session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly user = signal<User | null>(this.restore());

  readonly currentUser = this.user.asReadonly();
  readonly isSignedIn = computed(() => this.user() !== null);

  signIn(request: SignInRequest, remember: boolean): Observable<User> {
    return this.http
      .post<User>(`${environment.apiBaseUrl}/authentication/sign-in`, {
        email: request.email.trim().toLowerCase(),
        password: request.password,
      })
      .pipe(
        tap((user) => {
          this.user.set(user);
          this.storage(remember)?.setItem(STORAGE_KEY, JSON.stringify(user));
        }),
      );
  }

  verifySupervisorPin(pin: string): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/authentication/verify-pin`, {
      userId: this.user()?.id,
      pin,
    });
  }

  signOut(): void {
    this.user.set(null);
    for (const remember of [true, false]) this.storage(remember)?.removeItem(STORAGE_KEY);
    this.router.navigate(['/sign-in']);
  }

  private restore(): User | null {
    for (const remember of [false, true]) {
      const raw = this.storage(remember)?.getItem(STORAGE_KEY);
      if (raw) {
        try {
          return JSON.parse(raw) as User;
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  private storage(remember: boolean): Storage | null {
    try {
      return remember ? localStorage : sessionStorage;
    } catch {
      return null;
    }
  }
}
