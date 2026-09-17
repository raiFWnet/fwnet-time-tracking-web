import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import {
  UpdateUserRequest,
  UserResponse,
  UserRole
} from './user.model';
import { UserService } from './user.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent implements OnInit {
  private readonly userService = inject(UserService);

  readonly users = signal<UserResponse[]>([]);
  readonly selectedUser = signal<UserResponse | null>(null);

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
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
        Validators.pattern(/^$|.*\S.*/)
      ]
    }),
    role: new FormControl<UserRole>('ANALYST', {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    if (this.isLoading()) {
      return;
    }

    this.errorMessage.set('');
    this.isLoading.set(true);

    this.userService.findAll().pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: users => {
        this.users.set(users);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          this.getErrorMessage(error, 'load')
        );
      }
    });
  }

  selectUser(user: UserResponse): void {
    this.selectedUser.set(user);
    this.successMessage.set('');
    this.errorMessage.set('');

    this.form.reset({
      fullName: user.fullName,
      email: user.email,
      password: '',
      role: user.role
    });
  }

  cancelEdit(): void {
    this.selectedUser.set(null);
    this.successMessage.set('');
    this.errorMessage.set('');

    this.form.reset({
      fullName: '',
      email: '',
      password: '',
      role: 'ANALYST'
    });
  }

  submit(): void {
    const user = this.selectedUser();

    if (!user || this.isSaving()) {
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

    const request: UpdateUserRequest = this.form.getRawValue();

    this.isSaving.set(true);
    this.form.disable();

    this.userService.update(user.id, request).pipe(
      finalize(() => {
        this.isSaving.set(false);
        this.form.enable();
      })
    ).subscribe({
      next: updatedUser => {
        this.users.update(users =>
          users.map(currentUser =>
            currentUser.id === updatedUser.id
              ? updatedUser
              : currentUser
          )
        );

        this.form.reset({
          fullName: '',
          email: '',
          password: '',
          role: 'ANALYST'
        });

        this.selectedUser.set(null);

        this.successMessage.set(
          `Acesso de ${updatedUser.fullName} atualizado com sucesso.`
        );
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          this.getErrorMessage(error, 'update')
        );
      }
    });
  }

  getRoleLabel(role: UserRole): string {
    return role === 'ADMIN' ? 'Administrador' : 'Analista';
  }

  private getErrorMessage(
    error: HttpErrorResponse,
    action: 'load' | 'update'
  ): string {
    if (error.status === 0) {
      return 'Não foi possível conectar ao servidor.';
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
      return detail || 'Você não tem permissão para gerenciar acessos.';
    }

    if (error.status === 404) {
      return detail || 'Usuário não encontrado.';
    }

    if (error.status === 409) {
      return detail || 'Este e-mail já está cadastrado.';
    }

    if (error.status === 400) {
      return detail || 'Confira os campos preenchidos e tente novamente.';
    }

    if (action === 'load') {
      return 'Não foi possível carregar os usuários.';
    }

    return 'Não foi possível atualizar o acesso.';
  }
}