import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { App, AppStatus } from '../models/app.model';

/**
 * App Service
 * 
 * Central service for managing application data and operations in the Connectivity Toolbox.
 * This service acts as the single source of truth for app state and provides methods
 * for fetching, installing, updating, and uninstalling apps.
 */
@Injectable({
  providedIn: 'root'
})
export class AppService {
  /**
   * Backend base URL
   */
  private readonly apiBaseUrl = 'http://localhost:5000/api';

  /**
   * Reactive State Signal
   * 
   * Angular signal containing the current list of all applications.
   * The data is updated from the backend fetch endpoint.
   */
  private apps = signal<App[]>([]);

  /**
   * Constructor
   * 
   * Injects HttpClient so this service can communicate with the backend.
   */
  constructor(private http: HttpClient) {}

  /**
   * Get All Applications
   * 
   * Fetches the complete list of applications from the backend.
   * The backend should return the apps with their current status,
   * installedVersion, latest version, and supported versions.
   */
  getApps(): Observable<App[]> {
    return this.http.get<App[]>(`${this.apiBaseUrl}/fetch-data`).pipe(
      tap((apps) => {this.apps.set(apps)
      console.log('Fetched apps from backend:', apps);})
    );
  }

  /**
   * Get Application by ID
   * 
   * Fetches all apps from the backend and returns the app matching the given id.
   */
  getAppById(id: string): Observable<App | undefined> {
    return this.getApps().pipe(
      map((apps) => apps.find((app) => app.id === id))
    );
  }

  /**
   * Install Application
   * 
   * Installs the latest version of the app.
   */
  installApp(id: string): Observable<void> {
    const app = this.apps().find((a) => a.id === id);

    if (!app) {
      throw new Error('App not found');
    }

    return this.installAppVersion(id, app.version, '');
  }

  /**
   * Install Application Version
   * 
   * Installs a specific version of an app.
   */
  installAppVersion(id: string, targetVersion: string, targetOS: string): Observable<void> {
    return this.http.post<void>(
      `${this.apiBaseUrl}/install-app/${id}/${targetVersion}`,
      {}
    ).pipe(
      tap(() => this.refreshApps())
    );
  }

  /**
   * Uninstall Application
   * 
   * Sends uninstall request to the backend.
   */
  uninstallApp(id: string): Observable<void> {
    return this.http.post<void>(
      `${this.apiBaseUrl}/uninstall-app/${id}`,
      {}
    ).pipe(
      tap(() => this.refreshApps())
    );
  }

  /**
   * Update Application to Latest Version
   * 
   * Updates the app to its latest version.
   * Used by older UI flows that do not choose a specific version.
   */
  updateApp(id: string): Observable<void> {
    const app = this.apps().find((a) => a.id === id);

    if (!app) {
      throw new Error('App not found');
    }

    return this.updateAppToVersion(id, app.version, '');
  }

  /**
   * Update Application to a Specific Version
   * 
   * Updates or downgrades an app to the selected version.
   * The backend will determine if this is an update or downgrade based on the currently installed version.  
   */
  updateAppToVersion(id: string, targetVersion: string, targetOS: string): Observable<void> {
    return this.http.post<void>(
      `${this.apiBaseUrl}/update-app/${id}/${targetVersion}`,
      {}
    ).pipe(
      tap(() => this.refreshApps())
    );
  }

  /**
   * Get Apps Signal (Read-Only)
   * 
   * Returns a read-only signal reference to the apps array.
   */
  getAppsSignal() {
    return this.apps.asReadonly();
  }

  /**
   * Internal: Refresh Apps From Backend
   * 
   * After install/update/uninstall, fetches the updated app list
   * so the frontend state stays synchronized with the backend.
   */
  private refreshApps(): void {
    this.http.get<App[]>(`${this.apiBaseUrl}/fetch-data`).subscribe({
      next: (apps) => this.apps.set(apps),
      error: (error: unknown) => console.error('Failed to refresh apps', error)
    });
  }
}

