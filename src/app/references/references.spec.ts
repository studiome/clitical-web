import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { beforeEach, describe, expect, it } from 'vitest';

import { TranslationService } from '../services/translation';
import { References } from './references';

describe('References', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [References],
      providers: [provideNoopAnimations()],
    });
    TestBed.inject(TranslationService).setLocale('en');
  });

  it('shows the tap-to-open hint', async () => {
    const fixture = TestBed.createComponent(References);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Tap to open link.',
    );
  });

  it('links both citations to their DOIs, opening in a new tab safely', async () => {
    const fixture = TestBed.createComponent(References);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const links = [...host.querySelectorAll<HTMLAnchorElement>('a[href]')];
    const hrefs = links.map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('https://doi.org/10.1093/bjs/znab036');
    expect(hrefs).toContain('https://doi.org/10.1016/j.ejvs.2022.05.038');
    for (const a of links) {
      expect(a.getAttribute('target')).toBe('_blank');
      expect(a.getAttribute('rel')).toContain('noopener');
    }
  });

  it('shows both citation texts', async () => {
    const fixture = TestBed.createComponent(References);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent!;
    expect(text).toContain('Br J Surg. 2022');
    expect(text).toContain('Eur J Vasc Endovasc Surg');
  });
});
