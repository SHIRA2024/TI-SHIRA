import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppService } from '../../services/app.service';
import { App, AppStatus } from '../../models/app.model';
import { AppLogoComponent } from '../../shared/components/app-logo/app-logo.component';

/** Full details view for an app with version management and actions */
@Component({
  selector: 'app-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AppLogoComponent],
  templateUrl: './app-details.component.html',
  styleUrl: './app-details.component.css'
})
export class AppDetailsComponent implements OnInit {

  app = signal<App | null>(null);
  loading = signal<boolean>(true);
  actionInProgress = signal<string | null>(null);
  showVersions = false;
  selectedVersion: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public appService: AppService
  ) {}

  ngOnInit(): void {
    const appId = this.route.snapshot.paramMap.get('id');
    if (appId) {
      this.loadApp(appId);
    }
    console.log(appId);
  }

  loadApp(id: string): void {
    this.loading.set(true);
    this.appService.getAppById(id).subscribe({
      next: (app) => {
        console.log('Fetched app details:', app);
        if (app) {
          this.app.set(app);
        }
        this.loading.set(false);
      },
      error: (error: unknown) => {
        console.error('Failed to load app', error);
        this.loading.set(false);
      }
    });
  }

  handleVersionChange(version: string): void {
    this.selectedVersion = version;
    this.showVersions = false;
  }

  handleDownloadOlderVersion(): void {
    const app = this.app();
    if (!app || !this.selectedVersion) return;

    this.actionInProgress.set('download');

    this.appService.installAppVersion(app.id, this.selectedVersion, '').subscribe({
      next: () => {
        this.app.set({ ...app, status: AppStatus.UpToDate, installedVersion: this.selectedVersion });
        this.selectedVersion = null;
        this.actionInProgress.set(null);
      },
      error: (error: unknown) => {
        console.error('Failed to download version', error);
        this.actionInProgress.set(null);
      }
    });
  }

  handleUninstall(): void {
    const app = this.app();
    if (!app) return;

    this.actionInProgress.set('uninstall');

    this.appService.uninstallApp(app.id).subscribe({
      next: () => {
        this.app.set({ ...app, status: AppStatus.NotInstalled, installedVersion: null });
        const versions = app.versions;
        this.selectedVersion = versions && versions.length > 0 ? versions[0] : null;
        this.actionInProgress.set(null);
      },
      error: (error: unknown) => {
        console.error('Failed to uninstall app', error);
        this.actionInProgress.set(null);
      }
    });
  }

  toggleVersions(): void {
    this.showVersions = !this.showVersions;
  }

  get isRunning(): boolean {
    const app = this.app();
    return !!app && this.appService.isAppRunning(app.id);
  }

  get isLaunching(): boolean {
    const app = this.app();
    return !!app && this.appService.isLaunching(app.id);
  }

  handleLaunch(): void {
    const app = this.app();
    if (!app) return;
    this.appService.launchApp(app.id, app.name);
  }

  handleStop(): void {
    const app = this.app();
    if (!app) return;
    this.appService.stopApp(app.id);
  }

  get olderVersions(): string[] {
    const app = this.app();
    if (!app || !app.versions) return [];
    return app.versions.filter(v => v !== app.latestVersion && v !== app.installedVersion);
  }

  get canChooseVersion(): boolean {
    return !!this.app();
  }

  get canUninstall(): boolean {
    return this.app()?.status === AppStatus.UpToDate ||
           this.app()?.status === AppStatus.UpdateAvailable;
  }

  get canInstallLatest(): boolean {
    return this.app()?.installedVersion === null && !!this.app();
  }

  get canUpdateToLatest(): boolean {
    const app = this.app();
    return !!app && app.installedVersion !== null && app.installedVersion !== app.latestVersion;
  }

  handleInstallLatest(): void {
    const app = this.app();
    if (!app) return;
    this.actionInProgress.set('install-latest');
    this.appService.installAppVersion(app.id, app.latestVersion, '').subscribe({
      next: () => { this.app.set({ ...app, status: AppStatus.UpToDate, installedVersion: app.latestVersion }); this.actionInProgress.set(null); },
      error: (e) => { console.error('Failed to install latest', e); this.actionInProgress.set(null); }
    });
  }

  handleUpdateToLatest(): void {
    const app = this.app();
    if (!app) return;
    this.actionInProgress.set('update-latest');
    this.appService.updateAppToVersion(app.id, app.latestVersion).subscribe({
      next: () => { this.app.set({ ...app, status: AppStatus.UpToDate, installedVersion: app.latestVersion }); this.actionInProgress.set(null); },
      error: (e) => { console.error('Failed to update to latest', e); this.actionInProgress.set(null); }
    });
  }

  refreshAppById(): void {
    const app = this.app();
    if (!app) return;

    this.loading.set(true);
    this.appService.getAppById(app.id).subscribe({
      next: (updatedApp) => {
        this.app.set(updatedApp);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Refresh failed', error);
        this.loading.set(false);
      }
    });
  }
}