import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, of, catchError } from 'rxjs';
import { App, AppStatus, WSMessage } from '../models/app.model';
import { NotificationService } from './notification.service';
import { NetworkService } from './network.service';


export interface OperationResult {
  success: boolean;
  message: string;
}

/** Core service for app data and API operations */
@Injectable({
  providedIn: 'root'
})
export class AppService {
  private readonly apiBaseUrl = 'http://localhost:5000/api';
  private apps = signal<App[]>([]);

  runningApps = signal<string[]>([]);
  launchingApps = signal<string[]>([]);

  runningAppDetails = computed(() =>
    this.runningApps().map(id => ({
      id,
      name: this.apps().find(a => a.id === id)?.name ?? id
    }))
  );

  isAppRunning(id: string): boolean {
    return this.runningApps().includes(id);
  }

  isLaunching(id: string): boolean {
    return this.launchingApps().includes(id);
  }

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private network: NetworkService
  ) {
    this.network.messages$.subscribe(msg => this.handleWSMessage(msg));
    this.network.connect();
  }

  //////////////////////////////////////APP FETCHING ///////////////////////////////////////

  /** Fetch all apps with status mapping */
  getApps(): Observable<App[]> {
    return this.http.get<any>(`${this.apiBaseUrl}/fetch-data`).pipe(
      map(backendData => {
        const backendAppsArray = Object.values(backendData);
        const resApps:App[] = [];
        backendAppsArray.forEach((backendApp:any)=>{
          if (!backendApp.id || !backendApp.description || !backendApp.name || !backendApp.status || !backendApp.latestVersion) {
            console.log(`The app: ${backendApp} is missing necessary props`)
            return;
          }
          if (backendApp.status!=="up to date"&&backendApp.status!=="not installed"&&backendApp.status!=="update available"){
            console.log(`The app with id: ${backendApp.id} has a wrong type of status`)
            return;
          }
          let mappedStatus = AppStatus.UpToDate;
          if (backendApp.status === 'not installed') {
            mappedStatus = AppStatus.NotInstalled;
          } else if (backendApp.status === 'update available') {
            mappedStatus = AppStatus.UpdateAvailable;
          }
          resApps.push({
            ...backendApp,
            id: String(backendApp.id),
            status: mappedStatus,
          } as App);

        });
        return resApps;
      }),
      tap((apps: App[]) => {
        this.apps.set(apps);
        console.log('Mapped apps ready for UI:', apps);
      }),
      catchError((error:any) => {
        console.error('An error occurred during fetch-data process: ',error);
        const cachedApps = this.apps();
        if (cachedApps.length > 0) {
          console.log('Successfully recovered the apps list from cache!');
          return of(cachedApps);
        }
        throw error;
      })
    );
  }


  /** Fetch single app by ID with cache fallback */
  getAppById(id: string): Observable<App> {
    return this.http.get<any>(`${this.apiBaseUrl}/fetch-data/${id}`).pipe(
      map(backendApp => {

        if (!backendApp || typeof backendApp !== 'object' || Array.isArray(backendApp)) {
          throw new Error(`Invalid response for app ${id}: expected an object, got ${typeof backendApp}`);
        }
        if (!backendApp.id || !backendApp.description || !backendApp.name || !backendApp.status || !backendApp.latestVersion) {
          throw new Error(`The app: ${backendApp} is missing necessary props`)
        }
        if (backendApp.status!=="up to date"&&backendApp.status!=="not installed"&&backendApp.status!=="update available"){
          throw new Error(`The app with id: ${backendApp.id} has a wrong type of status`)  
        }
        let mappedStatus = AppStatus.UpToDate;
        if (backendApp.status === 'not installed') {
          mappedStatus = AppStatus.NotInstalled;
        } else if (backendApp.status === 'update available') {
          mappedStatus = AppStatus.UpdateAvailable;
        }
        return {
            ...backendApp,
            id: String(backendApp.id),
            status: mappedStatus,
          } as App
      }), 
      tap((mappedApp: App) => {
        const currentApps = this.apps();
        const existingIndex = currentApps.findIndex(a => String(a.id) === String(id));
        if (existingIndex >= 0) {
          const newApps = [...currentApps];
          newApps[existingIndex] = mappedApp;
          this.apps.set(newApps);
        } else {
          this.apps.set([...currentApps, mappedApp]);
        }
      }),
      catchError((error) => {
        console.warn(`Network fetch failed for app ${id}. Attempting to use local cache...`);
        const cachedApp = this.apps().find(a => String(a.id) === String(id));
        if (cachedApp) {
          console.log(`Successfully recovered App ${id} from cache!`);
          return of(cachedApp);
        }
        console.error(`App ${id} is completely missing.`);
        throw error;
      })
    );
  }

//////////////////////////////////////APP LAUNCHING\CLOSING ///////////////////////////////////////

  private handleWSMessage(msg: WSMessage): void {
    switch (msg.type) {
      case 'app-running':
        if (msg.appId) {
          this.launchingApps.update(list => list.filter(id => id !== msg.appId));
          this.addRunningApp(msg.appId);
        }
        break;
      case 'app-stopped':
        if (msg.appId) this.removeRunningApp(msg.appId);
        break;
    }
  }

  launchApp(id: string, name: string): void {
    this.network.send({ type: 'launch', appId: id });
    this.launchingApps.update(list => [...list, id]);
    setTimeout(() => {
      if (this.isLaunching(id)) {
        this.launchingApps.update(list => list.filter(a => a !== id));
        this.notificationService.showError(`Failed to launch ${name}`);
      }
    }, 30000);
  }

  stopApp(id: string): void {
    this.network.send({ type: 'stop', appId: id });
  }
  addRunningApp(id: string) {
    if (!this.isAppRunning(id)) {
      this.runningApps.update(list => [...list, id]);
    }
  }
  addLaunchingApp(id: string) {
    if (!this.isLaunching(id)) {
      this.launchingApps.update(list => [...list, id]);
    }
  }

  removeRunningApp(id: string) {
    this.runningApps.update(list => list.filter(a => a !== id));
  }
  removeLaunchingApp(id: string) {
    this.launchingApps.update(list => list.filter(a => a !== id));
  }

  
//////////////////////////////////////APP INSTALL\UNINSTALL\UPDATE OPERATIONS ///////////////////////////////////////


  installAppVersion(id: string, targetVersion: string, targetOS: string): Observable<OperationResult> {
    return this.http.get<OperationResult>(
      `${this.apiBaseUrl}/install-app/${id}/${targetVersion}`,
      {}
    ).pipe(
      tap((response: OperationResult) => {
        if (!response?.success) throw new Error(response?.message || 'Install failed');
        this.updateAppInCache(id, { status: AppStatus.UpToDate, installedVersion: targetVersion });
      })
    );
  }

  

  updateAppToVersion(id: string, targetVersion: string): Observable<OperationResult> {
    return this.http.get<OperationResult>(
      `${this.apiBaseUrl}/update-app/${id}/${targetVersion}`,
      {}
    ).pipe(
      tap((response: OperationResult) => {
        if (!response?.success) throw new Error(response?.message || 'Update failed');
        this.updateAppInCache(id, { status: AppStatus.UpToDate, installedVersion: targetVersion });
      })
    );
  }


  

  uninstallApp(id: string): Observable<OperationResult> {
    return this.http.get<OperationResult>(
      `${this.apiBaseUrl}/uninstall-app/${id}`,
      {}
    ).pipe(
      tap((response:any)=>{
        if (!response?.success||response.success!==true){
          throw Error("Http response isn't successful")
        }
        this.updateAppInCache(id,{status:AppStatus.NotInstalled,installedVersion:null})
      }),
    );
  }

//////////////////////////////////////UTILITY FUNCTIONS ///////////////////////////////////////

  /** Returns a read-only signal reference to the apps array */
  getAppsSignal() {
    return this.apps.asReadonly();
  }

   /** Refresh apps from backend */
  refreshApps(): void {
    this.getApps().subscribe({
      error: (error: unknown) => console.error('Failed to refresh apps', error)
    });
  }
  private updateAppInCache(id: string, changes: Partial<App>): void {
    const currentApps = this.apps();
    const index = currentApps.findIndex(a => String(a.id) === String(id));
    if (index >= 0) {
      const newApps = [...currentApps];
      newApps[index] = { ...currentApps[index], ...changes };
      this.apps.set(newApps);
    }
  }
}

