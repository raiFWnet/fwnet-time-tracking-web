import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';

import { adminGuard } from './admin.guard';
import { TokenStorageService } from '../services/token-storage.service';

class TokenStorageServiceStub {
  token: string | null = null;

  getToken(): string | null {
    return this.token;
  }
}

describe('adminGuard', () => {
  let tokenStorage: TokenStorageServiceStub;
  let router: Router;

  function createToken(payload: Record<string, unknown>): string {
    const encodedPayload = btoa(JSON.stringify(payload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return `test-header.${encodedPayload}.test-signature`;
  }

  function executeGuard() {
    return TestBed.runInInjectionContext(() =>
      adminGuard(
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot
      )
    );
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: TokenStorageService,
          useClass: TokenStorageServiceStub
        }
      ]
    });

    tokenStorage = TestBed.inject(
      TokenStorageService
    ) as unknown as TokenStorageServiceStub;

    router = TestBed.inject(Router);
  });

  it('should redirect to login when no token exists', () => {
    const result = executeGuard() as UrlTree;

    expect(router.serializeUrl(result)).toBe('/login');
  });

  it('should allow an administrator with an unexpired token', () => {
    tokenStorage.token = createToken({
      role: 'ADMIN',
      exp: Math.floor(Date.now() / 1000) + 3600
    });

    expect(executeGuard()).toBe(true);
  });

  it('should redirect an analyst to the dashboard', () => {
    tokenStorage.token = createToken({
      role: 'ANALYST',
      exp: Math.floor(Date.now() / 1000) + 3600
    });

    const result = executeGuard() as UrlTree;

    expect(router.serializeUrl(result)).toBe('/');
  });

  it('should deny an administrator with an expired token', () => {
    tokenStorage.token = createToken({
      role: 'ADMIN',
      exp: Math.floor(Date.now() / 1000) - 60
    });

    const result = executeGuard() as UrlTree;

    expect(router.serializeUrl(result)).toBe('/');
  });

  it('should deny a token without expiration', () => {
    tokenStorage.token = createToken({
      role: 'ADMIN'
    });

    const result = executeGuard() as UrlTree;

    expect(router.serializeUrl(result)).toBe('/');
  });

  it('should deny a malformed token without throwing an error', () => {
    tokenStorage.token = 'invalid-token';

    const result = executeGuard() as UrlTree;

    expect(router.serializeUrl(result)).toBe('/');
  });

  it('should deny a token with an invalid JSON payload', () => {
    tokenStorage.token = `header.${btoa('invalid-json')}.signature`;

    const result = executeGuard() as UrlTree;

    expect(router.serializeUrl(result)).toBe('/');
  });
});