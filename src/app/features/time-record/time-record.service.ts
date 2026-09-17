import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AdminTimeRecordCorrectionResponse,
  AdminTimeRecordResponse,
  CorrectTimeRecordRequest,
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

  getAdminHistory(): Observable<AdminTimeRecordResponse[]> {
    return this.http.get<AdminTimeRecordResponse[]>(
      `${this.apiUrl}/admin`
    );
  }

  getAdminCorrectionLogs(): Observable<AdminTimeRecordCorrectionResponse[]> {
    return this.http.get<AdminTimeRecordCorrectionResponse[]>(
      `${this.apiUrl}/admin/corrections`
    );
  }

  correctAdminTimeRecord(
    id: string,
    request: CorrectTimeRecordRequest
  ): Observable<AdminTimeRecordResponse> {
    return this.http.patch<AdminTimeRecordResponse>(
      `${this.apiUrl}/admin/${id}`,
      request
    );
  }
}