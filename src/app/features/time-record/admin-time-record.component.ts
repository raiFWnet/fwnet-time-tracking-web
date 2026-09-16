import {
  Component,
  computed,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FormControl,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { TimeRecordService } from './time-record.service';
import {
  AdminTimeRecordResponse,
  CorrectTimeRecordRequest,
  TimeRecordType
} from './time-record.model';

@Component({
  selector: 'app-admin-time-record',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule
  ],
  templateUrl: './admin-time-record.component.html',
  styleUrl: './admin-time-record.component.css'
})
export class AdminTimeRecordComponent implements OnInit {
  private readonly timeRecordService = inject(TimeRecordService);

  readonly records = signal<AdminTimeRecordResponse[]>([]);
  readonly loading = signal(false);
  readonly historyLoaded = signal(false);
  readonly errorMessage = signal('');

  readonly selectedRecord =
    signal<AdminTimeRecordResponse | null>(null);

  readonly correcting = signal(false);
  readonly correctionErrorMessage = signal('');
  readonly correctionSuccessMessage = signal('');

  readonly analystFilter = new FormControl('', {
    nonNullable: true
  });

  readonly workDateFilter = new FormControl('', {
    nonNullable: true
  });

  readonly correctionWorkDate = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required
    ]
  });

  readonly correctionRecordedDate = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required
    ]
  });

  readonly correctionRecordedTime = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required
    ]
  });

  readonly correctionReason = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.pattern(/\S/),
      Validators.maxLength(500)
    ]
  });

  readonly selectedAnalystEmail = signal('');
  readonly selectedWorkDate = signal('');

  readonly analystOptions = computed(() => {
    const analysts = new Map<string, string>();

    for (const record of this.records()) {
      analysts.set(
        record.userEmail,
        record.userFullName
      );
    }

    return Array
      .from(
        analysts,
        ([email, fullName]) => ({
          email,
          fullName
        })
      )
      .sort((first, second) =>
        first.fullName.localeCompare(
          second.fullName,
          'pt-BR'
        )
      );
  });

  readonly filteredRecords = computed(() => {
    const analystEmail =
      this.selectedAnalystEmail();

    const workDate =
      this.selectedWorkDate();

    return this.records().filter((record) => {
      const matchesAnalyst =
        !analystEmail ||
        record.userEmail === analystEmail;

      const matchesWorkDate =
        !workDate ||
        record.workDate === workDate;

      return matchesAnalyst && matchesWorkDate;
    });
  });

  readonly hasActiveFilters = computed(() =>
    this.selectedAnalystEmail().length > 0 ||
    this.selectedWorkDate().length > 0
  );

  private readonly recordLabels: Record<
    TimeRecordType,
    string
  > = {
    CLOCK_IN: 'Entrada',
    LUNCH_OUT: 'Saída para almoço',
    LUNCH_IN: 'Retorno do almoço',
    CLOCK_OUT: 'Saída da jornada'
  };

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.historyLoaded.set(false);
    this.errorMessage.set('');
    this.correctionSuccessMessage.set('');
    this.records.set([]);

    this.timeRecordService
      .getAdminHistory()
      .pipe(
        finalize(() =>
          this.loading.set(false)
        )
      )
      .subscribe({
        next: (records) => {
          this.records.set(records);
          this.historyLoaded.set(true);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            this.getErrorMessage(error)
          );
        }
      });
  }

  applyFilters(): void {
    this.selectedAnalystEmail.set(
      this.analystFilter.value
    );

    this.selectedWorkDate.set(
      this.workDateFilter.value
    );
  }

  clearFilters(): void {
    this.analystFilter.setValue('');
    this.workDateFilter.setValue('');

    this.selectedAnalystEmail.set('');
    this.selectedWorkDate.set('');
  }

  openCorrection(
    record: AdminTimeRecordResponse
  ): void {
    this.selectedRecord.set(record);

    this.correctionWorkDate.setValue(
      record.workDate
    );

    this.correctionRecordedDate.setValue(
      record.recordedAt.slice(0, 10)
    );

    this.correctionRecordedTime.setValue(
      record.recordedAt.slice(11, 19)
    );

    this.correctionReason.setValue('');

    this.correctionWorkDate.markAsUntouched();
    this.correctionRecordedDate.markAsUntouched();
    this.correctionRecordedTime.markAsUntouched();
    this.correctionReason.markAsUntouched();

    this.correctionErrorMessage.set('');
    this.correctionSuccessMessage.set('');
  }

  closeCorrection(): void {
    if (this.correcting()) {
      return;
    }

    this.selectedRecord.set(null);
    this.correctionErrorMessage.set('');
  }

  submitCorrection(): void {
    const record = this.selectedRecord();

    if (!record || this.correcting()) {
      return;
    }

    this.correctionWorkDate.markAsTouched();
    this.correctionRecordedDate.markAsTouched();
    this.correctionRecordedTime.markAsTouched();
    this.correctionReason.markAsTouched();

    if (
      this.correctionWorkDate.invalid ||
      this.correctionRecordedDate.invalid ||
      this.correctionRecordedTime.invalid ||
      this.correctionReason.invalid
    ) {
      return;
    }

    const request: CorrectTimeRecordRequest = {
      workDate: this.correctionWorkDate.value,
      recordedAt: this.buildRecordedAt(
        this.correctionRecordedDate.value,
        this.correctionRecordedTime.value,
        record.recordedAt
      ),
      reason: this.correctionReason.value.trim()
    };

    this.correcting.set(true);
    this.correctionErrorMessage.set('');

    this.timeRecordService
      .correctAdminTimeRecord(
        record.id,
        request
      )
      .pipe(
        finalize(() =>
          this.correcting.set(false)
        )
      )
      .subscribe({
        next: (correctedRecord) => {
          this.records.update((records) =>
            records.map((currentRecord) =>
              currentRecord.id === correctedRecord.id
                ? correctedRecord
                : currentRecord
            )
          );

          this.selectedRecord.set(null);

          this.correctionSuccessMessage.set(
            'Marcação corrigida com sucesso.'
          );
        },
        error: (error: HttpErrorResponse) => {
          this.correctionErrorMessage.set(
            this.getCorrectionErrorMessage(error)
          );
        }
      });
  }

  getRecordLabel(
    recordType: TimeRecordType
  ): string {
    return (
      this.recordLabels[recordType] ??
      recordType
    );
  }

  formatWorkDate(value: string): string {
    return value
      .split('-')
      .reverse()
      .join('/');
  }

  formatRecordedAt(value: string): string {
    const date = value.slice(0, 10);
    const time = value.slice(11, 19);

    const offset = value.endsWith('Z')
      ? '+00:00'
      : value.slice(-6);

    return `${this.formatWorkDate(date)} às ${time} (UTC${offset})`;
  }

  private buildRecordedAt(
    dateValue: string,
    timeValue: string,
    originalValue: string
  ): string {
    const normalizedTime =
      timeValue.length === 5
        ? `${timeValue}:00`
        : timeValue;

    const dateTime =
      `${dateValue}T${normalizedTime}`;

    if (
      originalValue.slice(0, 19) ===
      dateTime
    ) {
      return originalValue;
    }

    if (originalValue.endsWith('Z')) {
      return `${dateTime}Z`;
    }

    const offset =
      originalValue.match(
        /([+-]\d{2}:\d{2})$/
      )?.[1] ?? 'Z';

    return `${dateTime}${offset}`;
  }

  private getCorrectionErrorMessage(
    error: HttpErrorResponse
  ): string {
    if (error.status === 0) {
      return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
    }

    if (error.status === 401) {
      return 'Sua sessão não é válida ou expirou. Saia e entre novamente.';
    }

    if (error.status === 403) {
      return 'Você não tem permissão para corrigir esta marcação.';
    }

    const body: unknown = error.error;

    if (
      error.status >= 400 &&
      error.status < 500 &&
      typeof body === 'object' &&
      body !== null &&
      'detail' in body &&
      typeof body.detail === 'string' &&
      body.detail.trim().length > 0
    ) {
      return body.detail;
    }

    return 'Não foi possível corrigir a marcação. Tente novamente.';
  }

  private getErrorMessage(
    error: HttpErrorResponse
  ): string {
    if (error.status === 0) {
      return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
    }

    if (error.status === 401) {
      return 'Sua sessão não é válida ou expirou. Volte ao painel, saia e entre novamente.';
    }

    const body: unknown = error.error;

    if (
      error.status >= 400 &&
      error.status < 500 &&
      typeof body === 'object' &&
      body !== null &&
      'detail' in body &&
      typeof body.detail === 'string' &&
      body.detail.trim().length > 0
    ) {
      return body.detail;
    }

    if (error.status === 403) {
      return 'Você não tem permissão para consultar as marcações administrativas.';
    }

    return 'Não foi possível carregar as marcações. Tente novamente.';
  }
}