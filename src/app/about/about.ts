import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

import { APP_VERSION } from '../app-version';
import { MessageKey } from '../services/messages';
import { TranslationService } from '../services/translation';

interface Prediction {
  title: MessageKey;
  icon: string;
}

@Component({
  selector: 'app-about',
  imports: [MatCardModule, MatIconModule, MatListModule],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About {
  protected readonly t = inject(TranslationService).t;
  protected readonly version = APP_VERSION;

  protected readonly predictions: Prediction[] = [
    { title: 'predicted30DAD', icon: 'monitor_heart' },
    { title: 'predicted30DMALE', icon: 'favorite_border' },
    { title: 'predicted2yrOS', icon: 'favorite' },
    { title: 'predicted2yrAFS', icon: 'directions_walk' },
    { title: 'gnri', icon: 'restaurant' },
  ];
}
