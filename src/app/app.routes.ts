import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { LoginComponent } from './features/auth/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { UserCreateComponent } from './features/users/user-create.component';
import { AdminTimeRecordComponent } from './features/time-record/admin-time-record.component';
import { AdminTimeRecordCorrectionLogComponent } from './features/time-record/admin-time-record-correction-log.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'users/new',
    component: UserCreateComponent,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'time-records/admin',
    component: AdminTimeRecordComponent,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'time-records/admin/corrections',
    component: AdminTimeRecordCorrectionLogComponent,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: '',
    pathMatch: 'full',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];