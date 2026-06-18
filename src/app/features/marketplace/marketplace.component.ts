import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppService } from '../../services/app.service';
import { App, AppStatus } from '../../models/app.model';
import { AppCardComponent } from '../../shared/components/app-card/app-card.component';

/** Main marketplace view for browsing, filtering, and managing apps */
type statusType = 'all'|'installed'|'update-available'|'available';
@Component({
  selector: 'app-marketplace',
  imports: [CommonModule, AppCardComponent],
  templateUrl: './marketplace.component.html',
  styleUrl: './marketplace.component.css'
})
export class MarketplaceComponent implements OnInit {
  apps = signal<App[]>([]);
  loading = signal<boolean>(true);
  viewMode = signal<'grid' | 'list'>('grid');

  filterStatus = signal<statusType>('all');

  constructor(private appService: AppService) {}

  ngOnInit(): void {
    this.loadApps();
  }

  loadApps(): void {
    this.loading.set(true);
    this.appService.getApps().subscribe({
      next: (apps) => {
        this.apps.set(apps);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load apps', error);
        this.loading.set(false);
      }
    });
  }

  toggleViewMode(): void {
    this.viewMode.set(this.viewMode() === 'grid' ? 'list' : 'grid');
  }

  setFilterStatus(status:statusType): void {
    this.filterStatus.set(status);
  }

  get filteredApps(): App[] {
    const apps = this.apps();
    const filter = this.filterStatus();
    if (filter === 'all') {
      return apps;
    }
    return apps.filter(app => app.status === filter as AppStatus);
  }

  get installedCount(): number {
    return this.apps().filter(app => app.status === AppStatus.UpToDate).length;
  }

  get updateAvailableCount(): number {
    return this.apps().filter(app => app.status === AppStatus.UpdateAvailable).length;
  }

  refreshApps(): void {
    this.appService.refreshApps();
  }
}

