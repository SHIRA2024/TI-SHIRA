import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef, signal } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AppService } from '../../services/app.service';
import { NotificationService } from '../../services/notification.service';
/** Main layout/navigation component providing the app shell */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  /**
   * Application Title
   * 
   * Display name for the Connectivity Toolbox application.
   * Shown in the header navigation bar.
   */
  title = 'Connectivity Toolbox';
  toastMessage: string | null = null;
  isRunningExpanded = signal(false);

  toggleRunningExpanded(): void {
    this.isRunningExpanded.update(v => !v);
  }

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    public appService: AppService,
    public notificationService: NotificationService
  ) {}

  private toastListener = (event: Event) => {
    const customEvent = event as CustomEvent<string>;
    this.ngZone.run(() => {
      this.showToast(customEvent.detail);
    });
  };

  ngOnInit(): void {
    window.addEventListener('show-toast', this.toastListener);
  }

  ngOnDestroy(): void {
    window.removeEventListener('show-toast', this.toastListener);
  }

  showToast(message: string): void {
    this.toastMessage = message;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.ngZone.run(() => {
        this.toastMessage = null;
        this.cdr.detectChanges();
      });
    }, 2500);
  }
}

