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
  templateUrl: './app-navigation.html',
  styleUrl: './app-navigation.scss',
})
export class AppNavigation {
  readonly destinations = input.required<NavDestination[]>();
  readonly activeId = input.required<string>();
  readonly ariaLabel = input<string>('');
}
