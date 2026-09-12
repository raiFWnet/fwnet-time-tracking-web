import {
  HttpClient,
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { authInterceptor } from './auth.interceptor';
import { TokenStorageService } from '../services/token-storage.service';

class TokenStorageServiceStub {

  token: string | null = null;

  getToken(): string | null {
    return this.token;
  }
}

describe('authInterceptor', () => {

  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let tokenStorage: TokenStorageServiceStub;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([authInterceptor])
        ),
        provideHttpClientTesting(),
        {
          provide: TokenStorageService,
          useClass: TokenStorageServiceStub
        }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);

    tokenStorage = TestBed.inject(
      TokenStorageService
    ) as unknown as TokenStorageServiceStub;
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should add the bearer token when a token exists', () => {
    tokenStorage.token = 'jwt-token-test';

    httpClient.get('/test').subscribe();

    const request = httpTestingController.expectOne('/test');

    expect(
      request.request.headers.get('Authorization')
    ).toBe('Bearer jwt-token-test');

    request.flush({});
  });

  it('should not add the authorization header when no token exists', () => {
    tokenStorage.token = null;

    httpClient.get('/test').subscribe();

    const request = httpTestingController.expectOne('/test');

    expect(
      request.request.headers.has('Authorization')
    ).toBe(false);

    request.flush({});
  });
});