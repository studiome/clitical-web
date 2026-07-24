import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { PatientDataStore } from '../../services/patient-data-store';
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
    const male = [...document.querySelectorAll<HTMLElement>('mat-option')].find(
      (option) => option.textContent?.includes('Male'),
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
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('.analyze-button');
    button.click();
    await fixture.whenStable();
    expect(document.body.textContent).toContain(
      'Error! Missing some data at Number Form.',
    );
    expect(router.url).not.toBe('/result');
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

  it('resets all answers from the bottom reset button', async () => {
    store.numbers.set({ age: 65, heightCm: 150, weight: 50, alb: 4 });
    store.setField('sex', 'male');
    const reset: HTMLButtonElement =
      fixture.nativeElement.querySelector('.reset-button');
    reset.click();
    await fixture.whenStable();
    expect(store.data().sex).toBe('female');
    expect(store.numbers().age).toBeNull();
  });
});
