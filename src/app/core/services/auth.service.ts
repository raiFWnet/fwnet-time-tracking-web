import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { LoginRequest } from '../models/login-request.model';
import { LoginResponse } from '../models/login-response.model';
import { TokenStorageService } from './token-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly loginUrl = `${environment.apiUrl}/auth/login`;

  constructor(
    private readonly http: HttpClient,
    private readonly tokenStorage: TokenStorageService
  ) {}

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.loginUrl, request).pipe(
      tap(response => {
        this.tokenStorage.saveToken(response.token);
        this.tokenStorage.saveFullName(response.fullName);
      })
    );
  }

  isAuthenticated(): boolean {
    return this.tokenStorage.getToken() !== null;
  }

  getAuthenticatedUserName(): string {
    return this.tokenStorage.getFullName() ?? '';
  }

  isAdmin(): boolean {
    const token = this.tokenStorage.getToken();

    if (!token) {
      return false;
    }

    try {
      const parts = token.split('.');

      if (parts.length !== 3) {
        return false;
      }

      const base64 = parts[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const paddedBase64 = base64.padEnd(
        Math.ceil(base64.length / 4) * 4,
        '='
      );

      const payload: unknown = JSON.parse(atob(paddedBase64));

      if (
        typeof payload !== 'object' ||
        payload === null ||
        !('role' in payload) ||
        !('exp' in payload)
      ) {
        return false;
      }

      return payload.role === 'ADMIN'
        && typeof payload.exp === 'number'
        && Number.isFinite(payload.exp)
        && payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  logout(): void {
    this.tokenStorage.clearSession();
  }
}