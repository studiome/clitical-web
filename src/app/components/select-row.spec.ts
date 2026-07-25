import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { beforeEach, describe, expect, it } from 'vitest';

import { SelectRow } from './select-row';

@Component({
  imports: [SelectRow],
  template: `
    <app-select-row
      label="Sex"
      description="Male or Female"
      [options]="options"
      [value]="value()"
      (valueChange)="value.set($event)"
    />
  `,
})
class Host {
  readonly options = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ];
  readonly value = signal('female');
}

describe('SelectRow', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideNoopAnimations()],
    });
  });

  it('renders label, description and the selected label', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent!;
    expect(text).toContain('Sex');
    expect(text).toContain('Male or Female');
    expect(text).toContain('Female');
  });

  it('emits when another option is selected', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const select: HTMLElement = fixture.nativeElement.querySelector('mat-select');
    select.click();
    await fixture.whenStable();
    const male = [...document.querySelectorAll<HTMLElement>('mat-option')].find(
      (option) => option.textContent?.includes('Male'),
    );
    expect(male).toBeTruthy();
    male!.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toBe('male');
  });

  it('labels the select for assistive technology', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const select: HTMLElement = fixture.nativeElement.querySelector('mat-select');
    expect(select.getAttribute('aria-label')).toBe('Sex');
  });

  it('associates the visible description with the select via aria-describedby', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const select: HTMLElement = fixture.nativeElement.querySelector('mat-select');
    const description: HTMLElement =
      fixture.nativeElement.querySelector('.row-description');
    expect(description.id).toBeTruthy();
    expect(select.getAttribute('aria-describedby')).toContain(description.id);
  });

  it('omits aria-describedby when there is no description', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SelectRow],
      providers: [provideNoopAnimations()],
    });
    const fixture = TestBed.createComponent(SelectRow);
    fixture.componentRef.setInput('label', 'Sex');
    fixture.componentRef.setInput('options', [{ value: 'male', label: 'Male' }]);
    fixture.componentRef.setInput('value', 'male');
    await fixture.whenStable();
    const select: HTMLElement = fixture.nativeElement.querySelector('mat-select');
    expect(select.hasAttribute('aria-describedby')).toBe(false);
  });
});
