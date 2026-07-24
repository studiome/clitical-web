import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterOutlet } from '@angular/router';

import { AboutDialog } from './components/about-dialog';
import { ReferencesDialog } from './components/references-dialog';
import { AppLocale } from './services/messages';
import { TranslationService } from './services/translation';

@Component({
  selector: 'app-root',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    RouterOutlet,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly dialog = inject(MatDialog);
  private readonly translation = inject(TranslationService);

  protected readonly t = this.translation.t;

  protected setLocale(locale: AppLocale): void {
    this.translation.setLocale(locale);
  }

  protected openReferences(): void {
    this.dialog.open(ReferencesDialog);
  }

  protected openAbout(): void {
    this.dialog.open(AboutDialog);
  }
}
