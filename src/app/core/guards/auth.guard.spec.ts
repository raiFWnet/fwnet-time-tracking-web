import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';

import { authGuard } from './auth.guard';
import { TokenStorageService } from '../services/token-storage.service';

class TokenStorageServiceStub {

  token: string | null = null;

  getToken(): string | null {
    return this.token;
  }
}

describe('authGuard', () => {

  let tokenStorage: TokenStorageServiceStub;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
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

  it('should allow access when a token exists', () => {
    tokenStorage.token = 'jwt-token-test';

    const result = TestBed.runInInjectionContext(() =>
      authGuard(
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot
      )
    );

    expect(result).toBe(true);
  });

  it('should redirect to login when no token exists', () => {
    tokenStorage.token = null;

    const result = TestBed.runInInjectionContext(() =>
      authGuard(
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot
      )
    ) as UrlTree;

    expect(router.serializeUrl(result)).toBe('/login');
  });
});