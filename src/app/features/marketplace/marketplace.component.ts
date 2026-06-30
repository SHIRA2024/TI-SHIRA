import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppService } from '../../services/app.service';
import { App, AppStatus } from '../../models/app.model';
import { AppCardComponent } from '../../shared/components/app-card/app-card.component';

/** Main marketplace view for browsing, filtering, and managing apps */
type statusType = 'all'|'installed'|'update-available'|'not-installed';
@Component({
  selector: 'app-marketplace',
  imports: [CommonModule, AppCardComponent],
  templateUrl: './marketplace.component.html',
  styleUrl: './marketplace.component.css'
})
export class MarketplaceComponent implements OnInit {
  apps = signal<App[]>([]);
  loading = signal<boolean>(false);
  viewMode = signal<'grid' | 'list'>('grid');
  isRecentlyRefreshed = signal<boolean>(false)
  filterStatus = signal<statusType>('all');

  constructor(private appService: AppService) {}

  ngOnInit(): void {
    this.loadApps();
  }
  
  loadApps(): void{
    if(this.appService.getAppsSignal()().length===0){    
      this.loading.set(true);
      this.isRecentlyRefreshed.set(true);
      this.appService.fetchData().subscribe({
        next: (apps) => {
          this.apps.set(apps);
          this.loading.set(false);
          setTimeout(()=>this.isRecentlyRefreshed.set(false),5000);
        },
        error: (error) => {
          console.error('Failed to load apps', error);
          this.loading.set(false);
          setTimeout(()=>this.isRecentlyRefreshed.set(false),5000);
        }
      }); 
    }
    else{
      this.apps.set(this.appService.getAppsSignal()())
    }
     
    
  }

  initialFetch(): void{
    this.loading.set(true);
    this.isRecentlyRefreshed.set(true);
    this.appService.initialFetch().subscribe({
      next: (apps) => {
        this.apps.set(apps);
        this.loading.set(false);
        setTimeout(()=>this.isRecentlyRefreshed.set(false),5000);
      },
      error: (error) => {
        console.error('Failed to load apps', error);
        this.loading.set(false);
        setTimeout(()=>this.isRecentlyRefreshed.set(false),5000);
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
    return apps.filter(app =>{ 
      if(filter === "installed")
        return app.status===AppStatus.UpToDate|| app.status===AppStatus.UpdateAvailable;
      if(filter==="not-installed")
        return app.status===AppStatus.NotInstalled;
      if(filter==="update-available")
        return app.status===AppStatus.UpdateAvailable;
      return;
      });
  }

  get installedCount(): number {
    return this.apps().filter(app => app.status === AppStatus.UpToDate||app.status===AppStatus.UpdateAvailable).length;
  }

  get updateAvailableCount(): number {
    return this.apps().filter(app => app.status === AppStatus.UpdateAvailable).length;
  }

  get notInstalledCount(): number {
    return this.apps().filter(app => app.status === AppStatus.NotInstalled).length;
  }
}

