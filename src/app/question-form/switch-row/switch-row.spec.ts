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
      onLabel="Yes"
      offLabel="No"
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

  it('shows the current on/off state as visible text', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const state: HTMLElement = fixture.nativeElement.querySelector('.row-state');
    expect(state.textContent?.trim()).toBe('No');

    fixture.componentInstance.checked.set(true);
    await fixture.whenStable();
    expect(state.textContent?.trim()).toBe('Yes');
  });

  it('hides the state text from assistive technology to avoid double announcement', async () => {
    // mat-slide-toggle already exposes role="switch" + aria-checked, so a
    // visible state label must be aria-hidden to avoid a duplicate
    // announcement (per Material 3 switch accessibility guidance).
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const state: HTMLElement = fixture.nativeElement.querySelector('.row-state');
    expect(state.getAttribute('aria-hidden')).toBe('true');
  });

  it('associates the visible description with the toggle via aria-describedby', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const toggle: HTMLElement = fixture.nativeElement.querySelector(
      'button[role="switch"]',
    );
    const description: HTMLElement =
      fixture.nativeElement.querySelector('.row-description');
    expect(description.id).toBeTruthy();
    expect(toggle.getAttribute('aria-describedby')).toBe(description.id);
  });

  it('omits aria-describedby when there is no description', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SwitchRow],
      providers: [provideNoopAnimations()],
    });
    const fixture = TestBed.createComponent(SwitchRow);
    fixture.componentRef.setInput('label', 'Fever');
    fixture.componentRef.setInput('checked', false);
    await fixture.whenStable();
    const toggle: HTMLElement = fixture.nativeElement.querySelector(
      'button[role="switch"]',
    );
    expect(toggle.hasAttribute('aria-describedby')).toBe(false);
  });

  it('omits the state text when no on/off labels are provided', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SwitchRow],
      providers: [provideNoopAnimations()],
    });
    const fixture = TestBed.createComponent(SwitchRow);
    fixture.componentRef.setInput('label', 'Fever');
    fixture.componentRef.setInput('checked', false);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.row-state')).toBeNull();
  });
});
