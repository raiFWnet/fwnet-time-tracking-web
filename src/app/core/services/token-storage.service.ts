import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {

  private readonly tokenKey = 'fwnet_time_tracking_token';
  private readonly fullNameKey = 'fwnet_time_tracking_full_name';

  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  saveFullName(fullName: string): void {
    localStorage.setItem(this.fullNameKey, fullName);
  }

  getFullName(): string | null {
    return localStorage.getItem(this.fullNameKey);
  }

  clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.fullNameKey);
  }
}