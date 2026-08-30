import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IntendedUseService } from '../services/intended-use';
import { TranslationService } from '../services/translation';
import { IntendedUse } from './intended-use';

describe('IntendedUse', () => {
  const acknowledge = vi.fn();

  beforeEach(() => {
    acknowledge.mockReset();
    TestBed.configureTestingModule({
      imports: [IntendedUse],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        {
          provide: IntendedUseService,
          useValue: { isAcknowledged: signal(false).asReadonly(), acknowledge },
        },
      ],
    });
  });

  it('presents all five safety points without exposing the application shell', async () => {
    const fixture = TestBed.createComponent(IntendedUse);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const headings = [...host.querySelectorAll('.notice-point h2 span')].map((heading) =>
      heading.textContent?.trim(),
    );

    expect(headings).toEqual([
      'Who this app is for',
      'This is not a medical device',
      'About the values it shows',
      'Scope and limitations',
      'The final decision',
    ]);
    expect(host.querySelector('h1')?.textContent).toContain('Before you begin');
  });

  it('uses the legal URL for the selected language and records acknowledgement', async () => {
    TestBed.inject(TranslationService).setLocale('ja');
    const fixture = TestBed.createComponent(IntendedUse);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const terms = host.querySelector<HTMLAnchorElement>('a.terms-link');
    expect(terms?.href).toBe('https://studiome.github.io/clitical-legal/terms/ja/');
    expect(terms?.textContent).toContain('利用規約・免責事項を読む');

    host.querySelector<HTMLButtonElement>('button')!.click();
    expect(acknowledge).toHaveBeenCalledOnce();
  });
});
