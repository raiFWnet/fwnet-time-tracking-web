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
  ReactiveFormsModule
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { TimeRecordService } from './time-record.service';
import {
  AdminTimeRecordCorrectionResponse,
  TimeRecordType
} from './time-record.model';

@Component({
  selector: 'app-admin-time-record-correction-log',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule
  ],
  templateUrl: './admin-time-record-correction-log.component.html',
  styleUrl: './admin-time-record-correction-log.component.css'
})
export class AdminTimeRecordCorrectionLogComponent implements OnInit {
  private readonly timeRecordService = inject(TimeRecordService);

  readonly logs =
    signal<AdminTimeRecordCorrectionResponse[]>([]);

  readonly loading = signal(false);
  readonly logsLoaded = signal(false);
  readonly errorMessage = signal('');

  readonly selectedLog =
    signal<AdminTimeRecordCorrectionResponse | null>(null);

  readonly analystFilter = new FormControl('', {
    nonNullable: true
  });

  readonly dateFilter = new FormControl('', {
    nonNullable: true
  });

  readonly selectedAnalystEmail = signal('');
  readonly selectedDate = signal('');

  readonly analystOptions = computed(() => {
    const analysts = new Map<string, string>();

    for (const log of this.logs()) {
      analysts.set(
        log.analystEmail,
        log.analystFullName
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

  readonly filteredLogs = computed(() => {
    const analystEmail =
      this.selectedAnalystEmail();

    const date =
      this.selectedDate();

    return this.logs().filter((log) => {
      const matchesAnalyst =
        !analystEmail ||
        log.analystEmail === analystEmail;

      const matchesDate =
        !date ||
        log.previousWorkDate === date ||
        log.newWorkDate === date;

      return matchesAnalyst && matchesDate;
    });
  });

  readonly hasActiveFilters = computed(() =>
    this.selectedAnalystEmail().length > 0 ||
    this.selectedDate().length > 0
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
    this.loadLogs();
  }

  loadLogs(): void {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.logsLoaded.set(false);
    this.errorMessage.set('');
    this.logs.set([]);

    this.timeRecordService
      .getAdminCorrectionLogs()
      .pipe(
        finalize(() =>
          this.loading.set(false)
        )
      )
      .subscribe({
        next: (logs) => {
          this.logs.set(logs);
          this.logsLoaded.set(true);
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

    this.selectedDate.set(
      this.dateFilter.value
    );
  }

  clearFilters(): void {
    this.analystFilter.setValue('');
    this.dateFilter.setValue('');

    this.selectedAnalystEmail.set('');
    this.selectedDate.set('');
  }

  openDetails(
    log: AdminTimeRecordCorrectionResponse
  ): void {
    this.selectedLog.set(log);
  }

  closeDetails(): void {
    this.selectedLog.set(null);
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

  formatDateTime(value: string): string {
    const date = value.slice(0, 10);
    const time = value.slice(11, 19);

    const offset = value.endsWith('Z')
      ? '+00:00'
      : value.slice(-6);

    return `${this.formatWorkDate(date)} às ${time} (UTC${offset})`;
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

    if (error.status === 403) {
      return 'Você não tem permissão para consultar os logs de correções.';
    }

    return 'Não foi possível carregar os logs de correções. Tente novamente.';
  }
}