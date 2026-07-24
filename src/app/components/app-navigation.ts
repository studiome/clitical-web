import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

export interface NavDestination {
  id: string;
  label: string;
  icon: string;
  link: string;
}

/**
 * Material 3 adaptive navigation: a bottom navigation bar on compact widths
 * (< 600px) and a navigation rail on medium/expanded widths (>= 600px). The
 * same destinations render in both; only the layout changes, via CSS. Matches
 * the three destinations of the sibling iOS/Android apps (Risk / References /
 * Settings).
 */
@Component({
  selector: 'app-navigation',
  imports: [MatIconModule, RouterLink],
  template: `
    <nav class="nav" [attr.aria-label]="ariaLabel()">
      @for (destination of destinations(); track destination.id) {
        <a
          class="dest"
          [class.active]="destination.id === activeId()"
          [routerLink]="destination.link"
          [attr.aria-current]="destination.id === activeId() ? 'page' : null"
        >
          <span class="indicator">
            <mat-icon aria-hidden="true">{{ destination.icon }}</mat-icon>
          </span>
          <span class="dest-label">{{ destination.label }}</span>
        </a>
      }
    </nav>
  `,
  styleUrl: './app-navigation.scss',
})
export class AppNavigation {
  readonly destinations = input.required<NavDestination[]>();
  readonly activeId = input.required<string>();
  readonly ariaLabel = input<string>('');
}
