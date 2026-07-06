import { Component, input } from '@angular/core';
import { AppStatus } from '../../../models/app.model';
import { CommonModule } from '@angular/common';

/** Colored badge displaying the current status of an application */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-status-badge.component.html',
  styleUrl: './app-status-badge.component.css'
})
export class AppStatusBadgeComponent {

  status = input.required<AppStatus>();

  get statusClass(): string {
    switch (this.status()) {
      case AppStatus.UpToDate: return 'badge-installed';
      case AppStatus.UpdateAvailable: return 'badge-update';
      case AppStatus.NotInstalled: return 'badge-not-installed';
      default: return '';
    }
  }

  get statusLabel(): string {
    switch (this.status()) {
      case AppStatus.UpToDate: return 'Up to Date';
      case AppStatus.UpdateAvailable: return 'Update Available';
      case AppStatus.NotInstalled: return 'Not Installed';
      default: return '';
    }
  }
}

