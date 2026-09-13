import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import { TimeRecordService } from './time-record.service';
import {
  TimeRecordResponse,
  TimeRecordType
} from './time-record.model';

@Component({
  selector: 'app-time-record',
  standalone: true,
  templateUrl: './time-record.component.html',
  styleUrl: './time-record.component.css'
})
export class TimeRecordComponent implements OnInit {
  private readonly timeRecordService = inject(TimeRecordService);

  readonly records = signal<TimeRecordResponse[]>([]);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly historyLoaded = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly recordOptions: ReadonlyArray<{
    type: TimeRecordType;
    label: string;
  }> = [
    { type: 'CLOCK_IN', label: 'Entrada' },
    { type: 'LUNCH_OUT', label: 'Saída para almoço' },
    { type: 'LUNCH_IN', label: 'Retorno do almoço' },
    { type: 'CLOCK_OUT', label: 'Saída da jornada' }
  ];

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    if (this.loading() || this.submitting()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.timeRecordService.getHistory()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (records) => {
          this.records.set(records);
          this.historyLoaded.set(true);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            this.getErrorMessage(error, 'Não foi possível carregar o histórico.')
          );
        }
      });
  }

  register(recordType: TimeRecordType): void {
    if (this.submitting() || this.loading()) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.timeRecordService.create({ recordType })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (record) => {
          this.records.update((records) => [
            record,
            ...records.filter((item) => item.id !== record.id)
          ]);

          this.successMessage.set(
            `${this.getRecordLabel(record.recordType)} registrada com sucesso.`
          );
        },
        error: (error: HttpErrorResponse) => {
          const fallback = error.status === 0
            ? 'Não foi possível confirmar a marcação. Atualize o histórico antes de tentar novamente.'
            : 'Não foi possível registrar o ponto.';

          this.errorMessage.set(this.getErrorMessage(error, fallback));
        }
      });
  }

  getRecordLabel(recordType: TimeRecordType): string {
    return this.recordOptions.find((option) => option.type === recordType)?.label
      ?? recordType;
  }

  formatWorkDate(value: string): string {
    return value.split('-').reverse().join('/');
  }

  formatRecordedAt(value: string): string {
    const date = value.slice(0, 10);
    const time = value.slice(11, 19);
    const offset = value.endsWith('Z') ? '+00:00' : value.slice(-6);

    return `${this.formatWorkDate(date)} às ${time} (UTC${offset})`;
  }

  private getErrorMessage(
    error: HttpErrorResponse,
    fallback: string
  ): string {
    if (error.status === 401) {
      return 'Sua sessão não é válida ou expirou. Saia e entre novamente.';
    }

    const body: unknown = error.error;

    if (
      error.status >= 400 &&
      error.status < 500 &&
      typeof body === 'object' &&
      body !== null &&
      'detail' in body &&
      typeof body.detail === 'string'
    ) {
      return body.detail;
    }

    if (error.status === 403) {
      return 'Você não tem permissão para realizar esta operação.';
    }

    return fallback;
  }
}