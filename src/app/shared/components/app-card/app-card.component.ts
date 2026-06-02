import { Component, input, output, Input } from '@angular/core';
import { App, AppStatus } from '../../../models/app.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppStatusBadgeComponent } from '../app-status-badge/app-status-badge.component';
import { AppService } from '../../../services/app.service';
/**
 * App Card Component
 * 
 * A reusable card component that displays app information and provides action buttons
 * for installing, updating, or uninstalling applications. This component encapsulates
 * the card UI pattern used throughout the application.
 * 
 * Design Pattern: Presentational Component with Event Delegation
 * - Receives app data via input
 * - Emits events for user actions (doesn't perform actions directly)
 * - Parent components handle the actual business logic
 * 
 * This separation allows the card to be used in different contexts (marketplace,
 * installed apps, search results) while maintaining consistent UI/UX.
 * 
 * Usage:
 * ```html
 * <app-card 
 *   [app]="myApp"
 *   (onInstall)="handleInstall($event)"
 *   (onUpdate)="handleUpdate($event)"
 *   (onUninstall)="handleUninstall($event)">
 * </app-card>
 * ```
 * 
 * @component
 * @standalone This is a standalone component (Angular 17+)
 */
@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, RouterModule, AppStatusBadgeComponent],
  templateUrl: './app-card.component.html',
  styleUrl: './app-card.component.css'
})
export class AppCardComponent {

  app = input.required<App>();
  onInstall = output<string>();
  onUninstall = output<string>();
  onUpdate = output<string>();

  constructor(public appService: AppService) {}
  
  /**
   * Can Install Check
   * 
   * Determines if the install button should be displayed.
   * Only apps with status 'Available' can be installed.
   * 
   * @returns {boolean} True if install action is available
   */
  get canInstall(): boolean {
    return this.app().status === AppStatus.Available;
  }

  /**
   * Can Uninstall Check
   * 
   * Determines if the uninstall button should be displayed.
   * Only apps with status 'Installed' can be uninstalled.
   * 
   * Note: Apps with 'UpdateAvailable' status are still considered installed,
   * but we show the update button instead of uninstall in that case.
   * 
   * @returns {boolean} True if uninstall action is available
   */
  get canUninstall(): boolean {
    return this.app().status === AppStatus.Installed;
  }

  /**
   * Can Update Check
   * 
   * Determines if the update button should be displayed.
   * Only apps with status 'UpdateAvailable' can be updated.
   * 
   * @returns {boolean} True if update action is available
   */
  get canUpdate(): boolean {
    return this.app().status === AppStatus.UpdateAvailable;
  }

  /**
   * Handle Install Action
   * 
   * Called when the user clicks the install button.
   * Emits the app ID to the parent component via the onInstall output.
   * 
   * Event Flow:
   * 1. User clicks install button
   * 2. handleInstall() is called
   * 3. onInstall.emit(app.id) notifies parent
   * 4. Parent component handles installation via AppService
   */
  handleInstall(): void {
    this.onInstall.emit(this.app().id);
  }

  /**
   * Handle Uninstall Action
   * 
   * Called when the user clicks the uninstall button.
   * Emits the app ID to the parent component via the onUninstall output.
   * 
   * Event Flow:
   * 1. User clicks uninstall button
   * 2. handleUninstall() is called
   * 3. onUninstall.emit(app.id) notifies parent
   * 4. Parent component handles uninstallation via AppService
   */
  handleUninstall(): void {
    this.onUninstall.emit(this.app().id);
  }

  /**
   * Handle Update Action
   * 
   * Called when the user clicks the update button.
   * Emits the app ID to the parent component via the onUpdate output.
   * 
   * Event Flow:
   * 1. User clicks update button
   * 2. handleUpdate() is called
   * 3. onUpdate.emit(app.id) notifies parent
   * 4. Parent component handles update via AppService
   */
  handleUpdate(): void {
    this.onUpdate.emit(this.app().id);
  }

  handleRun(): void {
      this.appService.openApp(this.app().id).subscribe({
        error: (err) => console.error('Failed to run app', err)
      });
    }

}

