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
    this.showVersions = false;
  }

  /**
   * Install / update / downgrade according to selected version and OS
   */
  handlePrimaryVersionAction(): void {
    const app = this.app();
    console.log('Update button clicked');
    console.log('app:', app);
    console.log('selectedVersion:', this.selectedVersion);
    console.log('app status:', app?.status);

    if (!app || !this.selectedVersion) {
      return;
    }

    this.actionInProgress.set('update');

    const action$ = app.status === AppStatus.Available
      ? this.appService.installAppVersion(app.id, this.selectedVersion, '')
      : this.appService.updateAppToVersion(app.id, this.selectedVersion, '');

    action$.subscribe({
      next: () => {
        this.loadApp(app.id);
        this.selectedVersion = null;
        this.actionInProgress.set(null);
      },
      error: (error: unknown) => {
        console.error('Failed to apply selected version', error);
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
        this.selectedVersion = null;
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
   * Versions shown in dropdown.
   * Available app: show all versions.
   * Installed latest: show older versions only.
   * Update available: show latest + older versions.
   */
    get versionOptions(): string[] {
    const app = this.app();
    if (!app) return [];

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

  // אם כבר הגיע V מהשרת — לא נוסיף עוד אחד
  const displayVersion = version.toLowerCase().startsWith('v')
    ? version
    : `V${version}`;

  if (!app) return displayVersion;

  if (version === app.version) {
    return `${displayVersion} (latest)`;
  }

  return displayVersion;
}

reloadCurrentApp(): void {
  const app = this.app();

  if (!app) {
    return;
  }

  this.loading.set(true);

  this.appService.reloadApp(app.id).subscribe({
    next: (updatedApp) => {
      this.app.set(updatedApp);

      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: `${updatedApp.name} reloaded successfully`
        })
      );

      this.loading.set(false);
    },
    error: (error) => {
      console.error('Failed to reload app', error);
      this.loading.set(false);
    }
  });
}


}