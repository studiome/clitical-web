import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { beforeEach, describe, expect, it } from 'vitest';

import { About } from './about';
import { TranslationService } from '../services/translation';

describe('About', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [About],
      providers: [provideNoopAnimations()],
    });
  });

  it('describes the model, five predicted indicators, limitations, privacy, disclaimer, and credits', async () => {
    const fixture = TestBed.createComponent(About);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const text = host.textContent!;

    expect(text).toContain('CLTI revascularisation risk prediction');
    expect(text).toContain('Overview');
    expect(text).toContain('Intended use');
    expect(text).toContain('What it predicts');
    expect(text).toContain('Predicted 30-day Amputation/Death');
    expect(text).toContain('Predicted 30-day MALE');
    expect(text).toContain('Predicted 2-year OS');
    expect(text).toContain('Predicted 2-year AFS');
    expect(text).toContain('GNRI');
    expect(text).toContain('How the values are calculated');
    expect(text).toContain('Model source');
    expect(text).toContain('Scope and limitations');
    expect(text).toContain('Privacy');
    expect(text).toContain('Disclaimer');
    expect(text).toContain('Credits');
  });

  it('renders the same content in Japanese', async () => {
    TestBed.inject(TranslationService).setLocale('ja');
    const fixture = TestBed.createComponent(About);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent!;

    expect(text).toContain('CLTI血行再建リスク予測');
    expect(text).toContain('概要');
    expect(text).toContain('使用目的');
    expect(text).toContain('予測できる指標');
    expect(text).toContain('算出方法');
    expect(text).toContain('モデルの出典');
    expect(text).toContain('適用範囲と限界');
    expect(text).toContain('プライバシー');
    expect(text).toContain('免責事項');
    expect(text).toContain('クレジット');
  });

  it('groups the About content with Material cards and lists', async () => {
    const fixture = TestBed.createComponent(About);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('mat-card')).toHaveLength(4);
    expect(host.querySelectorAll('.prediction-list mat-list-item')).toHaveLength(5);
    expect(host.querySelectorAll('.credits-list mat-list-item')).toHaveLength(3);
    expect(host.querySelectorAll('mat-icon').length).toBeGreaterThanOrEqual(5);
    expect(host.querySelector('h1')?.textContent).toContain('About');
    expect(host.querySelector('.about-brand')?.textContent).toContain('CLiTICAL');
    expect(host.querySelector('h1')?.textContent).not.toContain('CLiTICAL');
  });
});
