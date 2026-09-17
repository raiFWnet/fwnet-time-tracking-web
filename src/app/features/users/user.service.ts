import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CreateUserRequest,
  UpdateUserRequest,
  UserResponse
} from './user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/users`;

  create(request: CreateUserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.apiUrl, request);
  }

  findAll(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(this.apiUrl);
  }

  update(
    id: string,
    request: UpdateUserRequest
  ): Observable<UserResponse> {
    return this.http.put<UserResponse>(
      `${this.apiUrl}/${id}`,
      request
    );
  }
}