import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';

class TokenStorageServiceStub {

  savedToken: string | null = null;

  saveToken(token: string): void {
    this.savedToken = token;
  }

  getToken(): string | null {
    return this.savedToken;
  }

  clearToken(): void {
    this.savedToken = null;
  }
}

describe('AuthService', () => {

  let authService: AuthService;
  let httpTestingController: HttpTestingController;
  let tokenStorage: TokenStorageServiceStub;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: TokenStorageService,
          useClass: TokenStorageServiceStub
        }
      ]
    });

    authService = TestBed.inject(AuthService);
    httpTestingController = TestBed.inject(HttpTestingController);
    tokenStorage = TestBed.inject(
      TokenStorageService
    ) as unknown as TokenStorageServiceStub;
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should send login credentials and save the returned token', () => {
    const request = {
      email: 'admin@fwnet.com.br',
      password: '123456'
    };

    const response = {
      token: 'jwt-token-test'
    };

    authService.login(request).subscribe(result => {
      expect(result).toEqual(response);
    });

    const httpRequest = httpTestingController.expectOne(
      `${environment.apiUrl}/auth/login`
    );

    expect(httpRequest.request.method).toBe('POST');
    expect(httpRequest.request.body).toEqual(request);

    httpRequest.flush(response);

    expect(tokenStorage.savedToken).toBe(response.token);
  });

  it('should report the user as authenticated when a token exists', () => {
    tokenStorage.saveToken('jwt-token-test');

    expect(authService.isAuthenticated()).toBe(true);
  });

  it('should report the user as unauthenticated when no token exists', () => {
    expect(authService.isAuthenticated()).toBe(false);
  });

  it('should clear the token on logout', () => {
    tokenStorage.saveToken('jwt-token-test');

    authService.logout();

    expect(tokenStorage.savedToken).toBeNull();
  });
});