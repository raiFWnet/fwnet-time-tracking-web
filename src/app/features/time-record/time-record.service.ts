import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CreateTimeRecordRequest,
  TimeRecordResponse
} from './time-record.model';

@Injectable({
  providedIn: 'root'
})
export class TimeRecordService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/time-records`;

  create(request: CreateTimeRecordRequest): Observable<TimeRecordResponse> {
    return this.http.post<TimeRecordResponse>(this.apiUrl, request);
  }

  getHistory(): Observable<TimeRecordResponse[]> {
    return this.http.get<TimeRecordResponse[]>(this.apiUrl);
  }
}