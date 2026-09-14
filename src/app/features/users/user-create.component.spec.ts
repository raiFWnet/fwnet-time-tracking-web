import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../../environments/environment';
import { UserCreateComponent } from './user-create.component';
import { UserResponse, UserRole } from './user.model';

describe('UserCreateComponent', () => {
  let fixture: ComponentFixture<UserCreateComponent>;
  let component: UserCreateComponent;
  let httpTestingController: HttpTestingController;
  let element: HTMLElement;

  const apiUrl = `${environment.apiUrl}/users`;

  const response: UserResponse = {
    id: '00000000-0000-4000-8000-000000000001',
    fullName: 'Test User',
    email: 'user@example.com',
    role: 'ANALYST',
    active: true,
    createdAt: '2026-09-14T10:00:00Z',
    updatedAt: '2026-09-14T10:00:00Z'
  };

  function fillForm(role: UserRole = 'ANALYST'): void {
    component.form.setValue({
      fullName: '  Test User  ',
      email: '  user@example.com  ',
      password: ' test-password ',
      role
    });
  }

  function submitForm(): void {
    const form = element.querySelector('form');

    if (!form) {
      throw new Error('Form element was not found');
    }

    form.dispatchEvent(new Event('submit', {
      bubbles: true,
      cancelable: true
    }));

    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCreateComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserCreateComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;

    httpTestingController = TestBed.inject(HttpTestingController);

    fixture.detectChanges();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should display validation errors without sending an empty form', () => {
    submitForm();

    httpTestingController.expectNone(apiUrl);

    expect(component.form.invalid).toBe(true);
    expect(component.form.controls.fullName.touched).toBe(true);
    expect(component.form.controls.email.touched).toBe(true);
    expect(component.form.controls.password.touched).toBe(true);
    expect(element.textContent).toContain('Informe um nome válido');
    expect(element.textContent).toContain('Informe um e-mail válido');
    expect(element.textContent).toContain('Informe uma senha');
  });

  const roles: UserRole[] = ['ANALYST', 'ADMIN'];

  for (const role of roles) {
    it(`should create a ${role} user and reset the form`, () => {
      fillForm(role);
      submitForm();

      const request = httpTestingController.expectOne(apiUrl);

      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({
        fullName: 'Test User',
        email: 'user@example.com',
        password: ' test-password ',
        role
      });

      request.flush({ ...response, role });
      fixture.detectChanges();

      expect(element.querySelector('[role="status"]')?.textContent)
        .toContain('Acesso criado para Test User (user@example.com).');

      expect(component.form.getRawValue()).toEqual({
        fullName: '',
        email: '',
        password: '',
        role: 'ANALYST'
      });

      expect(component.form.pristine).toBe(true);
      expect(component.form.enabled).toBe(true);
      expect(component.isSubmitting()).toBe(false);
    });
  }

  it('should block a second submission while the request is pending', () => {
    fillForm();
    submitForm();

    expect(component.isSubmitting()).toBe(true);
    expect(component.form.disabled).toBe(true);

    const button = element.querySelector<HTMLButtonElement>(
      'button[type="submit"]'
    );

    expect(button?.disabled).toBe(true);

    submitForm();

    const request = httpTestingController.expectOne(apiUrl);

    request.flush(response);
    fixture.detectChanges();

    expect(component.isSubmitting()).toBe(false);
    expect(button?.disabled).toBe(false);
  });

  it('should display the duplicate email message and preserve the form', () => {
    fillForm();
    submitForm();

    const request = httpTestingController.expectOne(apiUrl);

    request.flush(
      { detail: 'Este e-mail já está cadastrado.' },
      { status: 409, statusText: 'Conflict' }
    );

    fixture.detectChanges();

    expect(element.querySelector('[role="alert"]')?.textContent)
      .toContain('Este e-mail já está cadastrado.');

    expect(component.form.controls.email.value).toBe('user@example.com');
    expect(component.form.enabled).toBe(true);
    expect(component.isSubmitting()).toBe(false);
    expect(component.successMessage()).toBe('');
  });

  const accessErrors = [
    {
      status: 401,
      statusText: 'Unauthorized',
      message: 'Sua sessão está inválida ou expirou. Entre novamente.'
    },
    {
      status: 403,
      statusText: 'Forbidden',
      message: 'Você não tem permissão para criar acessos.'
    }
  ];

  for (const error of accessErrors) {
    it(`should display the access error for status ${error.status}`, () => {
      fillForm();
      submitForm();

      const request = httpTestingController.expectOne(apiUrl);

      request.flush({}, {
        status: error.status,
        statusText: error.statusText
      });

      fixture.detectChanges();

      expect(element.querySelector('[role="alert"]')?.textContent)
        .toContain(error.message);

      expect(component.form.enabled).toBe(true);
      expect(component.isSubmitting()).toBe(false);
    });
  }

  it('should explain an uncertain result after a network failure', () => {
    fillForm();
    submitForm();

    const request = httpTestingController.expectOne(apiUrl);

    request.error(new ProgressEvent('error'));
    fixture.detectChanges();

    expect(element.querySelector('[role="alert"]')?.textContent)
      .toContain('O acesso pode ter sido criado');

    expect(component.form.enabled).toBe(true);
    expect(component.isSubmitting()).toBe(false);
    expect(component.successMessage()).toBe('');
  });
});