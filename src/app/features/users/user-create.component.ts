import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { UserRole } from './user.model';
import { UserService } from './user.service';

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './user-create.component.html',
  styleUrl: './user-create.component.css'
})
export class UserCreateComponent {
  private readonly userService = inject(UserService);

  readonly isSubmitting = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  readonly form = new FormGroup({
    fullName: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(150)
      ]
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.email,
        Validators.maxLength(180)
      ]
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/\S/)
      ]
    }),
    role: new FormControl<UserRole>('ANALYST', {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  submit(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.successMessage.set('');
    this.errorMessage.set('');

    this.form.controls.fullName.setValue(
      this.form.controls.fullName.value.trim()
    );

    this.form.controls.email.setValue(
      this.form.controls.email.value.trim()
    );

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const request = this.form.getRawValue();

    this.isSubmitting.set(true);
    this.form.disable();

    this.userService.create(request).pipe(
      finalize(() => {
        this.isSubmitting.set(false);
        this.form.enable();
      })
    ).subscribe({
      next: user => {
        this.form.reset({
          fullName: '',
          email: '',
          password: '',
          role: 'ANALYST'
        });

        this.successMessage.set(
          `Acesso criado para ${user.fullName} (${user.email}).`
        );
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.getErrorMessage(error));
      }
    });
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Não foi possível confirmar o cadastro. Verifique a conexão. '
        + 'O acesso pode ter sido criado; uma nova tentativa pode informar '
        + 'que o e-mail já está cadastrado.';
    }

    if (error.status === 401) {
      return 'Sua sessão está inválida ou expirou. Entre novamente.';
    }

    const body: unknown = error.error;

    const detail = (
      typeof body === 'object'
      && body !== null
      && 'detail' in body
      && typeof body.detail === 'string'
    ) ? body.detail.trim() : '';

    if (error.status === 403) {
      return detail || 'Você não tem permissão para criar acessos.';
    }

    if (error.status === 409) {
      return detail || 'Este e-mail já está cadastrado.';
    }

    if (error.status === 400) {
      return detail || 'Confira os campos preenchidos e tente novamente.';
    }

    return 'Não foi possível criar o acesso. Tente novamente mais tarde.';
  }
}