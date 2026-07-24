import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { beforeEach, describe, expect, it } from 'vitest';

import { SwitchRow } from './switch-row';

@Component({
  imports: [SwitchRow],
  template: `
    <app-switch-row
      label="Fever"
      description="body temperature is higher than 38℃"
      [checked]="checked()"
      (checkedChange)="checked.set($event)"
    />
  `,
})
class Host {
  readonly checked = signal(false);
}

describe('SwitchRow', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideNoopAnimations()],
    });
  });

  it('renders label and description', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent!;
    expect(text).toContain('Fever');
    expect(text).toContain('body temperature is higher than 38℃');
  });

  it('emits when the switch is toggled', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const toggle: HTMLElement = fixture.nativeElement.querySelector(
      'button[role="switch"]',
    );
    toggle.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.checked()).toBe(true);
  });

  it('labels the switch for assistive technology', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const toggle: HTMLElement = fixture.nativeElement.querySelector(
      'button[role="switch"]',
    );
    expect(toggle.getAttribute('aria-label')).toBe('Fever');
  });
});
