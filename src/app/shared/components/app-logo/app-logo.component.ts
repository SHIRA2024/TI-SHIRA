import { Component, input, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-logo.component.html',
  styleUrl: './app-logo.component.css'
})
export class AppLogoComponent {
  iconUrl = input<string | null>(null);
  name = input.required<string>();
  size = input<number>(80);

  validIcon = signal<boolean>(false);

  constructor() {
    effect(() => {
      const url = this.iconUrl();
      if (!url) {
        this.validIcon.set(false);
        return;
      }
      const img = new Image();
      img.onload = () => this.validIcon.set(true);
      img.onerror = () => this.validIcon.set(false);
      img.src = url;
    });
  }
}
