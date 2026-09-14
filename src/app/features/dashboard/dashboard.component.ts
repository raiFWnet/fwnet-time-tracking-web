import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { TimeRecordComponent } from '../time-record/time-record.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [TimeRecordComponent, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login'], { replaceUrl: true });
  }
}