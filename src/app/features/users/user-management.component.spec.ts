import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../../environments/environment';
import { UserManagementComponent } from './user-management.component';
import { UserResponse } from './user.model';

describe('UserManagementComponent', () => {
  let fixture: ComponentFixture<UserManagementComponent>;
  let component: UserManagementComponent;
  let httpTestingController: HttpTestingController;
  let element: HTMLElement;

  const apiUrl = `${environment.apiUrl}/users`;

  const users: UserResponse[] = [
    {
      id: '00000000-0000-4000-8000-000000000001',
      fullName: 'Test Admin',
      email: 'admin@example.com',
      role: 'ADMIN',
      active: true,
      createdAt: '2026-09-17T10:00:00Z',
      updatedAt: '2026-09-17T10:00:00Z'
    },
    {
      id: '00000000-0000-4000-8000-000000000002',
      fullName: 'Test Analyst',
      email: 'analyst@example.com',
      role: 'ANALYST',
      active: true,
      createdAt: '2026-09-17T10:00:00Z',
      updatedAt: '2026-09-17T10:00:00Z'
    }
  ];

  function flushUsers(): void {
    const request = httpTestingController.expectOne(apiUrl);

    expect(request.request.method).toBe('GET');

    request.flush(users);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserManagementComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserManagementComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;

    httpTestingController = TestBed.inject(HttpTestingController);

    fixture.detectChanges();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should load and display the registered users', () => {
    flushUsers();

    expect(component.users()).toEqual(users);
    expect(element.textContent).toContain('Test Admin');
    expect(element.textContent).toContain('admin@example.com');
    expect(element.textContent).toContain('Test Analyst');
    expect(element.textContent).toContain('analyst@example.com');
  });

  it('should open the edit modal with the selected user data', () => {
    flushUsers();

    component.selectUser(users[1]);
    fixture.detectChanges();

    expect(component.selectedUser()).toEqual(users[1]);

    expect(component.form.getRawValue()).toEqual({
      fullName: 'Test Analyst',
      email: 'analyst@example.com',
      password: '',
      role: 'ANALYST'
    });

    expect(element.querySelector('[role="dialog"]')).not.toBeNull();
    expect(element.textContent).toContain('EDIÇÃO DE ACESSO');
  });

  it('should update the user, close the modal and refresh the table', () => {
    flushUsers();

    component.selectUser(users[1]);
    fixture.detectChanges();

    component.form.setValue({
      fullName: 'Updated Analyst',
      email: 'updated@example.com',
      password: '',
      role: 'ADMIN'
    });

    component.submit();

    const request = httpTestingController.expectOne(
      `${apiUrl}/${users[1].id}`
    );

    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      fullName: 'Updated Analyst',
      email: 'updated@example.com',
      password: '',
      role: 'ADMIN'
    });

    const updatedUser: UserResponse = {
      ...users[1],
      fullName: 'Updated Analyst',
      email: 'updated@example.com',
      role: 'ADMIN',
      updatedAt: '2026-09-17T12:00:00Z'
    };

    request.flush(updatedUser);
    fixture.detectChanges();

    expect(component.selectedUser()).toBeNull();
    expect(element.querySelector('[role="dialog"]')).toBeNull();

    expect(element.textContent).toContain('Updated Analyst');
    expect(element.textContent).toContain('updated@example.com');

    expect(element.querySelector('[role="status"]')?.textContent)
      .toContain(
        'Acesso de Updated Analyst atualizado com sucesso.'
      );
  });

  it('should keep the modal open when the update fails', () => {
    flushUsers();

    component.selectUser(users[1]);
    fixture.detectChanges();

    component.form.setValue({
      fullName: 'Test Analyst',
      email: 'admin@example.com',
      password: '',
      role: 'ANALYST'
    });

    component.submit();

    const request = httpTestingController.expectOne(
      `${apiUrl}/${users[1].id}`
    );

    request.flush(
      { detail: 'Este e-mail já está cadastrado.' },
      {
        status: 409,
        statusText: 'Conflict'
      }
    );

    fixture.detectChanges();

    expect(component.selectedUser()).toEqual(users[1]);
    expect(element.querySelector('[role="dialog"]')).not.toBeNull();

    expect(element.querySelector('[role="alert"]')?.textContent)
      .toContain('Este e-mail já está cadastrado.');

    expect(component.form.enabled).toBe(true);
    expect(component.isSaving()).toBe(false);
  });
});