import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppService } from '../../services/app.service';
import { App, AppStatus } from '../../models/app.model';
import { catchError } from 'rxjs';
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
  loading = signal<boolean>(false);
  refreshBtnDisabled = signal<boolean>(false)
  refreshTimeoutId = signal<ReturnType<typeof setTimeout> | null>(null);
  actionInProgress = signal<string | null>(null);
  showVersions = false;
  selectedVersion: string | null = null;

  constructor(
    private route: ActivatedRoute,
    public appService: AppService
  ) {
    effect(() => {
      const currentApp = this.app();
      const runningApps = this.appService.runningApps();
      if(currentApp){
        if(runningApps.includes(currentApp.id)){
          this.actionInProgress.set("Running");
          this.checkForActiveTimeout()
          this.refreshBtnDisabled.set(true);
        }
        else{
          this.actionInProgress.set(null);
          this.refreshBtnDisabled.set(false);
        }
        
      }
    });
  }

  ngOnInit(): void {
    const apps = this.appService.getAppsSignal()();
    if (apps.length > 0) {
      this.setCurrentApp();
      return;
    }

    this.loading.set(true);

    this.appService.fetchData().pipe(
      catchError(() => this.appService.initialFetch())
    ).subscribe({
      next: () => {
        this.setCurrentApp();
        this.loading.set(false);
      },
      error: (e: unknown) => {
        console.error('Failed to load app data', e);
        this.setCurrentApp();
        this.loading.set(false);
      }
    });
  }

  // loadApp(id: string): void {
  //   this.loading.set(true);
  //   this.appService.getAppById(id).subscribe({
  //     next: (app) => {
  //       console.log('Fetched app details:', app);
  //       if (app) {
  //         this.app.set(app);
  //       }
  //       this.loading.set(false);
  //     },
  //     error: (error: unknown) => {
  //       console.error('Failed to load app', error);
  //       this.loading.set(false);
  //     }
  //   });
  // }

  setCurrentApp(){
    const appId = this.route.snapshot.paramMap.get('id');
    if (appId) {
      const found = this.appService.getAppsSignal()().find(a => a.id === appId);
      this.app.set(found ?? null);
    }
  }

  handleVersionChange(version: string): void {
    this.selectedVersion = version;
    this.showVersions = false;
  }

  handleDownloadOlderVersion(): void {
    const app = this.app();
    if (!app || !this.selectedVersion) return;

    this.checkForActiveTimeout()
    this.refreshBtnDisabled.set(true);

    this.actionInProgress.set('download');

    this.appService.installAppVersion(app.id, this.selectedVersion, '').subscribe({
      next: () => {
        this.app.set({ ...app, status: AppStatus.UpToDate, installedVersion: this.selectedVersion });
        this.selectedVersion = null;
        this.actionInProgress.set(null);
        this.addRefreshTimeout()
      },
      error: (error: unknown) => {
        console.error('Failed to download version', error);
        this.actionInProgress.set(null);
        this.addRefreshTimeout()
      }
    });
  }

  handleUninstall(): void {
    const app = this.app();
    if (!app) return;

    this.checkForActiveTimeout()
    this.refreshBtnDisabled.set(true);

    this.actionInProgress.set('uninstall');

    this.appService.uninstallApp(app.id).subscribe({
      next: () => {
        this.app.set({ ...app, status: AppStatus.NotInstalled, installedVersion: null });
        const versions = app.versions;
        this.selectedVersion = versions && versions.length > 0 ? versions[0] : null;
        this.actionInProgress.set(null);
        this.addRefreshTimeout()
      },
      error: (error: unknown) => {
        console.error('Failed to uninstall app', error);
        this.actionInProgress.set(null);
        this.addRefreshTimeout()
      }
    });
  }

  toggleVersions(): void {
    this.showVersions = !this.showVersions;
  }

  get isRunning(): boolean {
    const app = this.app();
    if(!!app && this.appService.isAppRunning(app.id)){
      return true;
    }
    return false;
  }

  get isLaunching(): boolean {
    const app = this.app();
    return !!app && this.appService.isLaunching(app.id);
  }

  handleLaunch(): void {
    this.actionInProgress.set("Launch")

    const app = this.app();
    if (!app) return;

    this.checkForActiveTimeout()
    this.refreshBtnDisabled.set(true);

    this.appService.launchApp(app.id, app.name);
  }

  handleStop(): void {
    const app = this.app();
    if (!app) return;
    this.appService.stopApp(app.id);
    this.addRefreshTimeout()
  }

  get olderVersions(): string[] {
    const app = this.app();
    if (!app || !app.versions) return [];
    return app.versions.filter(v => v !== app.latestVersion && v !== app.installedVersion);
  }

  get canChooseVersion(): boolean {
    return !!this.app()&&this.olderVersions.length>0;
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

    this.checkForActiveTimeout()
    this.refreshBtnDisabled.set(true);

    this.actionInProgress.set('install-latest');
    this.appService.installAppVersion(app.id, app.latestVersion, '').subscribe({
      next: () => { 
        this.app.set({ ...app, status: AppStatus.UpToDate, installedVersion: app.latestVersion }); 
        this.actionInProgress.set(null); 
        this.addRefreshTimeout()
      },
      error: (e) => { console.error('Failed to install latest', e); 
        this.actionInProgress.set(null); 
        this.addRefreshTimeout()
      }
    });
  }

  handleUpdateToLatest(): void {
    const app = this.app();
    if (!app) return;
    this.actionInProgress.set('update-latest');

    this.checkForActiveTimeout();
    this.refreshBtnDisabled.set(true);

    this.appService.updateAppToVersion(app.id, app.latestVersion).subscribe({
      next: () => { 
        this.app.set({ ...app, status: AppStatus.UpToDate, installedVersion: app.latestVersion }); 
        this.addRefreshTimeout()
      },  
      error: (e) => { 
        console.error('Failed to update to latest', e);
        this.addRefreshTimeout() 
      }
    });
  }

  refreshApp(): void {
    this.checkForActiveTimeout();
    this.loading.set(true);
    this.refreshBtnDisabled.set(true);
   
    this.appService.initialFetch().subscribe({
      next:()=>{
        this.setCurrentApp();
        this.loading.set(false);
        this.addRefreshTimeout()
      },
      error: (error:unknown) => {
        console.error('Refresh failed', error);
        this.loading.set(false);
        this.addRefreshTimeout()
      }
    });

  }


  addRefreshTimeout():void{
    const id = setTimeout(() => this.refreshBtnDisabled.set(false), 5000);
    this.refreshTimeoutId.set(id); 
  }
  checkForActiveTimeout():void{
    const existing = this.refreshTimeoutId();
    if (existing !== null) clearTimeout(existing);
  }
}