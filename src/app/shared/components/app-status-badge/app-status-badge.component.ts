import { Component, input } from '@angular/core';
import { AppStatus } from '../../../models/app.model';
import { CommonModule } from '@angular/common';

/**
 * App Status Badge Component
 * 
 * A reusable presentational component that displays the current status of an application
 * as a colored badge. This component encapsulates the visual representation of app status,
 * making it easy to maintain consistent styling across the application.
 * 
 * Design Pattern: Presentational Component
 * - Receives data via inputs (no business logic)
 * - Emits events via outputs (if needed)
 * - Focused on presentation and styling
 * 
 * Usage:
 * ```html
 * <app-status-badge [status]="app.status"></app-status-badge>
 * ```
 * 
 * @component
 * @standalone This is a standalone component (Angular 17+)
 */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-status-badge.component.html',
  styleUrl: './app-status-badge.component.css'
})
export class AppStatusBadgeComponent {
  /**
   * App Status Input
   * 
   * Required input signal that receives the current status of the app.
   * Uses Angular's new input() function for type-safe, reactive inputs.
   * 
   * @required This input must be provided when using the component
   */
  status = input.required<AppStatus>();
  
  /**
   * Status CSS Class Getter
   * 
   * Returns the appropriate CSS class name based on the app status.
   * These classes are defined in the component's CSS file and provide
   * visual styling (colors) for each status type.
   * 
   * Status Mapping:
   * - Installed → 'badge-installed' (green)
   * - UpdateAvailable → 'badge-update' (orange/amber)
   * - Available → 'badge-available' (gray)
   * 
   * @returns {string} CSS class name for styling the badge
   */
  get statusClass(): string {
    switch (this.status()) {
      case AppStatus.Installed:
        return 'badge-installed';
      case AppStatus.UpdateAvailable:
        return 'badge-update';
      case AppStatus.Available:
        return 'badge-available';
      default:
        return '';
    }
  }

  /**
   * Status Label Getter
   * 
   * Returns the human-readable label text for the current app status.
   * This provides the text content displayed inside the badge.
   * 
   * Status Labels:
   * - Installed → "Installed"
   * - UpdateAvailable → "Update Available"
   * - Available → "Available"
   * 
   * @returns {string} Display text for the status badge
   */
  get statusLabel(): string {
    switch (this.status()) {
      case AppStatus.Installed:
        return 'Installed';
      case AppStatus.UpdateAvailable:
        return 'Update Available';
      case AppStatus.Available:
        return 'Available';
      default:
        return '';
    }
  }
}

