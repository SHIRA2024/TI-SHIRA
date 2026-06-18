import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppService } from '../../services/app.service';
import { App, AppStatus } from '../../models/app.model';
import { AppCardComponent } from '../../shared/components/app-card/app-card.component';

/** View showing only installed apps and apps with available updates */
@Component({
  selector: 'app-installed',
  standalone: true,
  imports: [CommonModule, AppCardComponent],
  templateUrl: './installed.component.html',
  styleUrl: './installed.component.css'
})
export class InstalledComponent implements OnInit {
  apps = signal<App[]>([]);
  loading = signal<boolean>(true);

  constructor(private appService: AppService) {}

  ngOnInit(): void {
    this.loadApps();
  }

  loadApps(): void {
    this.loading.set(true);
    this.appService.getApps().subscribe({
      next: (allApps) => {
        const installedApps = allApps.filter(app =>
          app.status === AppStatus.UpToDate || app.status === AppStatus.UpdateAvailable
        );
        this.apps.set(installedApps);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load apps', error);
        this.loading.set(false);
      }
    });
  }
}

