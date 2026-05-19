import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppService } from '../../services/app.service';
import { App, AppStatus } from '../../models/app.model';
import { AppStatusBadgeComponent } from '../../shared/components/app-status-badge/app-status-badge.component';

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
   */
  actionInProgress = signal<string | null>(null);

  /**
   * Controls whether the versions dropdown is open
   */
  showVersions = false;

  /**
   * Selected version before install/update/downgrade
   */
  selectedVersion: string | null = null;

  /**
   * Selected OS for the selected version
   */
  selectedOS: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appService: AppService
  ) {}

  ngOnInit(): void {
    const appId = this.route.snapshot.paramMap.get('id');
    if (appId) {
      this.loadApp(appId);
    }
    console.log(appId);
  }

  /**
   * Fetch app data by ID
   */
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

  /**
   * User selected a version.
   * After choosing a version, the OS dropdown becomes relevant.
   */
  handleVersionChange(version: string): void {
    this.selectedVersion = version;
    this.selectedOS = null;
    this.showVersions = false;
  }

  /**
   * Install / update / downgrade according to selected version and OS
   */
  handlePrimaryVersionAction(): void {
    const app = this.app();

    if (!app || !this.selectedVersion || !this.selectedOS) {
      return;
    }

    this.actionInProgress.set('update');

    const action$ = app.status === AppStatus.Available
      ? this.appService.installAppVersion(app.id, this.selectedVersion, this.selectedOS)
      : this.appService.updateAppToVersion(app.id, this.selectedVersion, this.selectedOS);

    action$.subscribe({
      next: () => {
        this.loadApp(app.id);
        this.selectedVersion = null;
        this.selectedOS = null;
        this.actionInProgress.set(null);
      },
      error: (error: unknown) => {
        console.error('Failed to apply selected version', error);
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
          // 1. Tell Angular the app is gone
          this.app.set({
            ...app,
            status: AppStatus.Available,
            installedVersion: undefined
          });

          // 2. Pre-select the newest version so the button immediately says "Install"
          if (app.versionOrder && app.versionOrder.length > 0) {
            this.selectedVersion = app.versionOrder[0]; 
          } else {
            this.selectedVersion = null;
          }

          // 3. Clear OS so the user has to pick one before the Install button activates
          this.selectedOS = null; 
          
          // 4. Stop the loading spinner
          this.actionInProgress.set(null);
        },
        error: (error: unknown) => {
          console.error('Failed to uninstall app', error);
          this.actionInProgress.set(null);
        }
      });
    }
  /**
   * Toggle versions dropdown
   */
  toggleVersions(): void {
    this.showVersions = !this.showVersions;
  }

  /**
   * Launch app placeholder
   */
  /**
   * Launch the app by calling the backend open-app endpoint
   */
  handleLaunch(): void {
    const app = this.app();
    if (!app) return;

    this.appService.openApp(app.id).subscribe({ // calls the backend to open the app  
      next: (response) => {
        console.log('App opened successfully', response);
        
        window.dispatchEvent( // Show a notification on successful launch
          new CustomEvent('show-toast', {
            detail: `Running app: ${app.name}`
          })
        );
      },
      error: (error) => {
        console.error('Failed to open app', error);
      }
    });
  }
  /**
   * OS options depend on the selected version
   */
  get availableOperatingSystems(): string[] {
    const app = this.app();

    if (!app || !this.selectedVersion) {
      return [];
    }

    return app.versions[this.selectedVersion] || [];
  }

  /**
   * Versions shown in dropdown.
   * Available app: show all versions.
   * Installed latest: show older versions only.
   * Update available: show latest + older versions.
   */
  get versionOptions(): string[] { 
    const app = this.app();
    if (!app) return [];

    if (app.status === AppStatus.Installed) {
      return app.versionOrder.slice(1, 30);
    }

    return app.versionOrder.slice(0, 30); 
  }

  /**
 * Returns the index of a version in the version order.
 * Lower index means newer version.
 */
private getVersionIndex(version: string): number {
  const app = this.app();
  if (!app) return -1;

  return app.versionOrder.indexOf(version);
}

    /**
     * Main action label changes according to app state and selected version
     */
  get primaryActionLabel(): string {
    const app = this.app();

    if (!app || !this.selectedVersion) {
      return 'Select version';
    }

    if (app.status === AppStatus.Available) {
      return `Install v${this.selectedVersion}`;
    }

    const installedVersion = app.installedVersion;

    if (!installedVersion) {
      return `Install v${this.selectedVersion}`;
    }

    const selectedIndex = this.getVersionIndex(this.selectedVersion);
    const installedIndex = this.getVersionIndex(installedVersion);

    if (selectedIndex < installedIndex) {
      return `Update to v${this.selectedVersion}`;
    }

    if (selectedIndex > installedIndex) {
      return `Downgrade to v${this.selectedVersion}`;
    }

    return `Reinstall v${this.selectedVersion}`;
  }

  /**
   * Main action is enabled only after version and OS are selected
   */
  get canRunPrimaryAction(): boolean {
    return !!this.app() &&
           !!this.selectedVersion &&
           !!this.selectedOS &&
           this.actionInProgress() === null;
  }

  /**
   * Every app can choose a version:
   * available apps install a selected version,
   * installed apps can downgrade,
   * update-available apps can update/downgrade.
   */
  get canChooseVersion(): boolean {
    return !!this.app();
  }

  get canUninstall(): boolean {
    return this.app()?.status === AppStatus.Installed ||
           this.app()?.status === AppStatus.UpdateAvailable;
  }

  get isInstalled(): boolean {
    return this.app()?.status === AppStatus.Installed ||
           this.app()?.status === AppStatus.UpdateAvailable;
  }

  getVersionButtonLabel(version: string): string {
  const app = this.app();
  if (!app) return version;

  if (version === app.version) {
    return `v${version} (latest)`;
  }

  return `v${version}`;
}
}