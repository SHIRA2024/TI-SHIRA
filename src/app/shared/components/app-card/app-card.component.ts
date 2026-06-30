import { Component, input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { App } from '../../../models/app.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppStatusBadgeComponent } from '../app-status-badge/app-status-badge.component';
import { AppLogoComponent } from '../app-logo/app-logo.component';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, RouterModule, AppStatusBadgeComponent, AppLogoComponent],
  templateUrl: './app-card.component.html',
  styleUrl: './app-card.component.css'
})
export class AppCardComponent implements AfterViewInit {

  app = input.required<App>();

  hasOverflow = false;
  scrollDistance = 0;
  fontSize = 24;

  @ViewChild('cardName') cardNameRef!: ElementRef<HTMLHeadingElement>;

  ngAfterViewInit(): void {
    const el = this.cardNameRef.nativeElement;
    const sizes = [24, 21, 18, 16];
    let chosen = 24;

    for (const size of sizes) {
      el.style.fontSize = size + 'px';
      if (el.scrollWidth <= el.offsetWidth) {
        chosen = size;
        break;
      }
      chosen = size;
    }

    this.fontSize = chosen;

    if (el.scrollWidth > el.offsetWidth) {
      this.scrollDistance = el.scrollWidth - el.offsetWidth;
      this.hasOverflow = true;
    }
  }

}

