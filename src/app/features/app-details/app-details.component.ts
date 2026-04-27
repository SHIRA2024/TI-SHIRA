import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AppService } from '../../services/app.service';
import { App, AppStatus } from '../../models/app.model';
import { AppStatusBadgeComponent } from '../../shared/components/app-status-badge/app-status-badge.component';
import { FormsModule } from '@angular/forms';

/**
 * App Details Component
 * 
 * Displays full information about a selected application.
 * Allows install, update, uninstall, run, and version switching.
 */
@Component({
  selector: 'app-details',
  standalone: true,
  imports: [CommonModule, RouterModule, AppStatusBadgeComponent, FormsModule],
  templateUrl: './app-details.component.html',
  styleUrl: './app-details.component.css'
})
export class AppDetailsComponent implements OnInit {

  /**
   * Holds the current app being displayed
   */
  app = signal<App | null>(null);

  /**
   * Indicates loading state
   */
  loading = signal<boolean>(true);

  /**
   * Tracks which action is currently running
   * Possible values: 'install' | 'update' | 'uninstall' | null
   */
  actionInProgress = signal<string | null>(null);

  /**
   * Controls whether the versions dropdown is open
   */
  showVersions = false;

  /**
 * Currently selected operating system
 */
  selectedOS = 'Windows';

  /**
   * Constructor - injects routing and service dependencies
   */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appService: AppService
  ) {}

  /**
   * Runs on component initialization
   * Loads app based on route ID
   */
  ngOnInit(): void {
    const appId = this.route.snapshot.paramMap.get('id');
    if (appId) {
      this.loadApp(appId);
    }
  }

  /**
   * Fetch app data by ID
   * @param id - app identifier
   */
  loadApp(id: string): void {
    this.loading.set(true);

    this.appService.getAppById(id).subscribe({
      next: (app) => {
        if (app) {
          this.app.set(app);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load app', error);
        this.loading.set(false);
      }
    });
  }

  /**
   * Install the app
   */
  handleInstall(): void {
    const app = this.app();
    if (!app) return;

    this.actionInProgress.set('install');

    this.appService.installApp(app.id).subscribe({
      next: () => {
        this.loadApp(app.id);
        this.actionInProgress.set(null);
      },
      error: (error) => {
        console.error('Failed to install app', error);
        this.actionInProgress.set(null);
      }
    });
  }

  /**
   * Uninstall the app
   */
  handleUninstall(): void {
    const app = this.app();
    if (!app) return;

    this.actionInProgress.set('uninstall');

    this.appService.uninstallApp(app.id).subscribe({
      next: () => {
        this.loadApp(app.id);
        this.actionInProgress.set(null);
      },
      error: (error) => {
        console.error('Failed to uninstall app', error);
        this.actionInProgress.set(null);
      }
    });
  }

  /**
   * Update app to latest version
   */
  handleUpdate(): void {
    const app = this.app();
    if (!app) return;

    this.actionInProgress.set('update');

    this.appService.updateApp(app.id).subscribe({
      next: () => {
        this.loadApp(app.id);
        this.actionInProgress.set(null);
      },
      error: (error) => {
        console.error('Failed to update app', error);
        this.actionInProgress.set(null);
      }
    });
  }

  /**
   * 🔥 Change app version (update OR downgrade)
   * 
   * Called when user selects a version from dropdown
   * @param version - target version
   */
  handleVersionChange(version: string): void {
    const app = this.app();
    if (!app) return;

    this.actionInProgress.set('update');

    this.appService.updateAppToVersion(app.id, version).subscribe({
      next: () => {
        this.loadApp(app.id);
        this.showVersions = false;
        this.actionInProgress.set(null);
      },
      error: (error) => {
        console.error('Failed to change app version', error);
        this.actionInProgress.set(null);
      }
    });
  }

  /**
   * Toggle dropdown visibility
   */
  toggleVersions(): void {
    this.showVersions = !this.showVersions;
  }

  /**
   * Launch app (placeholder)
   */
  handleLaunch(): void {
    alert('App launch functionality would be implemented here.');
  }


    /**
   * Returns all operating systems supported by the current app
   */
  get availableOperatingSystems(): string[] {
    const app = this.app();
    if (!app) return [];

    const allOS = new Set<string>();

    for (const version of app.versionOrder) {
      const osList = app.versions[version] || [];
      osList.forEach(os => allOS.add(os));
    }

    return Array.from(allOS);
  }

  /**
   * Returns only versions that support the selected operating system
   */
  get filteredVersions(): string[] {
    const app = this.app();
    if (!app) return [];

    return app.versionOrder.filter(version =>
      app.versions[version]?.includes(this.selectedOS)
    );
  }

  /**
   * Returns true when versions dropdown should be available
   * for installed apps and apps with updates available
   */
  get canManageVersions(): boolean {
    return this.app()?.status === AppStatus.Installed ||
           this.app()?.status === AppStatus.UpdateAvailable;
  }
  /**
   * Check if install button should be shown
   */
  get canInstall(): boolean {
    return this.app()?.status === AppStatus.Available;
  }

  /**
   * Check if uninstall button should be shown
   */
  get canUninstall(): boolean {
    return this.app()?.status === AppStatus.Installed;
  }

  /**
   * Check if update button should be shown
   */
  get canUpdate(): boolean {
    return this.app()?.status === AppStatus.UpdateAvailable;
  }

  /**
   * Check if app is installed (for Run button)
   */
  get isInstalled(): boolean {
    return this.app()?.status === AppStatus.Installed ||
           this.app()?.status === AppStatus.UpdateAvailable;
  }
}