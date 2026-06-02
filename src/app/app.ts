import { Component, HostListener, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppService } from './services/app.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private shutdownScheduled = false;

  constructor(private appService: AppService) {}

  ngOnInit(): void {
    this.appService.cancelBackendShutdown().subscribe({
      error: (error: unknown) => {
        console.error('Failed to cancel backend shutdown', error);
      }
    });
  }

  @HostListener('window:pagehide')
  onPageHide(): void {
    if (this.shutdownScheduled) {
      return;
    }

    this.shutdownScheduled = true;
    this.appService.scheduleBackendShutdown();
  }
}