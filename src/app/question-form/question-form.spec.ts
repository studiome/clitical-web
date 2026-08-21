import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { PatientDataStore } from '../services/patient-data-store';
import { QuestionForm } from './question-form';

@Component({ template: '' })
class Blank {}

describe('QuestionForm', () => {
  let fixture: ComponentFixture<QuestionForm>;
  let store: PatientDataStore;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [QuestionForm],
      providers: [
        provideNoopAnimations(),
        provideRouter([
          { path: '', component: Blank },
          { path: 'result', component: Blank },
        ]),
      ],
    });
    store = TestBed.inject(PatientDataStore);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(QuestionForm);
    await fixture.whenStable();
  });

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent!;
  }

  function setInputValue(id: string, value: string): void {
    const input: HTMLInputElement = fixture.nativeElement.querySelector(`#${id}`);
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  it('renders the same grouped sections as the iOS/Android apps', () => {
    for (const expected of [
      'Basic Info',
      'Social History',
      'Clinical Info',
      'Artery Lesion Sites',
      'Other Vascular Lesions',
      'Complications',
    ]) {
      expect(text()).toContain(expected);
    }
    expect(text()).not.toContain('Instruction');
  });

  it('renders every question of the original apps', () => {
    for (const expected of [
      'Sex',
      'Age [year-old]',
      'Body Height [cm]',
      'Body Weight [kg]',
      'Serum Albumin [g/dl]',
      'Activity',
      'Congestive heart failure',
      'Coronary artery disease',
      'Cerebral vascular disease',
      'Chronic kidney disease',
      'Malignant neoplasm',
      'Aorto-Iliac',
      'Femoro-Popliteal',
      'Infrapopliteal',
      'Urgent revascularisation procedures',
      'Fever',
      'Abnormal WBC',
      'Local Infection',
      'Dyslipidemia',
      'Smoking Status',
      'Contralateral limb arterial occlusive lesions',
      'Other vascular lesions except contralateral limb',
      'Rutherford Classification',
    ]) {
      expect(text()).toContain(expected);
    }
  });

  it('has no description under the Rutherford Classification question', () => {
    expect(text()).not.toContain('classes 4, 5, or 6');
  });

  it('has no description under the Activity (ADL) question', () => {
    expect(text()).not.toContain('Ambulatory: able to walk');
  });

  it('has no description under the Malignant neoplasm question', () => {
    expect(text()).not.toContain('past history of malignant neoplasm');
  });

  it('stores numeric input values', async () => {
    const age: HTMLInputElement = fixture.nativeElement.querySelector('#age-input');
    age.value = '65';
    age.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(store.numbers().age).toBe(65);
  });

  it('updates the store when a select option is chosen', async () => {
    const sexSelect: HTMLElement = fixture.nativeElement.querySelector(
      '[data-question="sex"] mat-select',
    );
    sexSelect.click();
    await fixture.whenStable();
    const male = [...document.querySelectorAll<HTMLElement>('mat-option')].find((option) =>
      option.textContent?.includes('Male'),
    );
    expect(male).toBeTruthy();
    male!.click();
    await fixture.whenStable();
    expect(store.data().sex).toBe('male');
  });

  it('updates boolean answers through switch rows', async () => {
    const chfToggle: HTMLElement = fixture.nativeElement.querySelector(
      '[data-question="hasCHF"] button[role="switch"]',
    );
    chfToggle.click();
    await fixture.whenStable();
    expect(store.data().hasCHF).toBe(true);
  });

  it('shows an error snackbar when numeric data is missing', async () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.analyze-button');
    button.click();
    await fixture.whenStable();
    expect(document.body.textContent).toContain('Error! Missing some data at Number Form.');
    expect(router.url).not.toBe('/result');
  });

  it('marks the empty numeric fields invalid and shows field-level errors when analyze fails', async () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.analyze-button');
    button.click();
    await fixture.whenStable();

    for (const id of ['age-input', 'height-input', 'weight-input', 'alb-input']) {
      const input: HTMLInputElement = fixture.nativeElement.querySelector(`#${id}`);
      expect(input.getAttribute('aria-invalid')).toBe('true');
    }

    const errors = fixture.nativeElement.querySelectorAll('mat-error');
    expect(errors.length).toBe(4);
    expect(errors[0].textContent).toContain('This value is required.');
  });

  it('shows a lesion error when no lesion is selected', async () => {
    store.numbers.set({ age: 65, heightCm: 150, weight: 50, alb: 4 });
    store.setField('hasAILesion', false);
    fixture.nativeElement.querySelector('.analyze-button').click();
    await fixture.whenStable();
    expect(document.body.textContent).toContain('Error! Check Lesions choice.');
  });

  it('navigates to the result page after successful analysis', async () => {
    store.numbers.set({ age: 65, heightCm: 150, weight: 50, alb: 4 });
    fixture.nativeElement.querySelector('.analyze-button').click();
    await fixture.whenStable();
    expect(store.risk()).not.toBeNull();
    expect(router.url).toBe('/result');
  });

  it('rejects a zero height and shows the range error without navigating', async () => {
    setInputValue('age-input', '65');
    setInputValue('height-input', '0');
    setInputValue('weight-input', '50');
    setInputValue('alb-input', '4');
    await fixture.whenStable();

    fixture.nativeElement.querySelector('.analyze-button').click();
    await fixture.whenStable();

    expect(router.url).not.toBe('/result');
    const errors = [...fixture.nativeElement.querySelectorAll('mat-error')] as HTMLElement[];
    expect(errors.some((error) => error.textContent?.includes('permitted range'))).toBe(true);
  });

  it('rejects a negative age and shows the range error without navigating', async () => {
    setInputValue('age-input', '-5');
    setInputValue('height-input', '150');
    setInputValue('weight-input', '50');
    setInputValue('alb-input', '4');
    await fixture.whenStable();

    fixture.nativeElement.querySelector('.analyze-button').click();
    await fixture.whenStable();

    expect(router.url).not.toBe('/result');
    const errors = [...fixture.nativeElement.querySelectorAll('mat-error')] as HTMLElement[];
    expect(errors.some((error) => error.textContent?.includes('permitted range'))).toBe(true);
  });

  it('rejects a non-integer age and shows the range error', async () => {
    setInputValue('age-input', '65.5');
    setInputValue('height-input', '150');
    setInputValue('weight-input', '50');
    setInputValue('alb-input', '4');
    await fixture.whenStable();

    fixture.nativeElement.querySelector('.analyze-button').click();
    await fixture.whenStable();

    expect(router.url).not.toBe('/result');
    const errors = [...fixture.nativeElement.querySelectorAll('mat-error')] as HTMLElement[];
    expect(errors.some((error) => error.textContent?.includes('permitted range'))).toBe(true);
  });

  it('navigates to the result page when all numeric values are within range', async () => {
    setInputValue('age-input', '65');
    setInputValue('height-input', '150');
    setInputValue('weight-input', '50');
    setInputValue('alb-input', '4');
    await fixture.whenStable();

    fixture.nativeElement.querySelector('.analyze-button').click();
    await fixture.whenStable();

    expect(router.url).toBe('/result');
  });

  it('clears validation errors when reset is clicked after a failed analyze', async () => {
    fixture.nativeElement.querySelector('.analyze-button').click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('mat-error').length).toBeGreaterThan(0);

    fixture.nativeElement.querySelector('.reset-button').click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('mat-error').length).toBe(0);
  });

  it('resets all answers from the bottom reset button', async () => {
    store.numbers.set({ age: 65, heightCm: 150, weight: 50, alb: 4 });
    store.setField('sex', 'male');
    const reset: HTMLButtonElement = fixture.nativeElement.querySelector('.reset-button');
    reset.click();
    await fixture.whenStable();
    expect(store.data().sex).toBe('female');
    expect(store.numbers().age).toBeNull();
  });
});
