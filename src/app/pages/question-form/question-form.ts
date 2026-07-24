import { Component, computed, inject } from '@angular/core';
import { FieldTree, form, required, FormField } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

import { SelectOption, SelectRow } from '../../components/select-row';
import { SwitchRow } from '../../components/switch-row';
import { PatientData } from '../../models/patient-data';
import { NumericAnswers, PatientDataStore } from '../../services/patient-data-store';
import { TranslationService } from '../../services/translation';

type BooleanField = {
  [K in keyof PatientData]: PatientData[K] extends boolean ? K : never;
}[keyof PatientData];

type EnumField = 'sex' | 'activity' | 'ckd' | 'malignant' | 'rutherford';

type NumericField = keyof NumericAnswers;

type Row =
  | { kind: 'switch'; key: BooleanField; label: string; description?: string }
  | {
      kind: 'select';
      key: EnumField;
      label: string;
      description?: string;
      options: SelectOption[];
    }
  | {
      kind: 'number';
      key: NumericField;
      label: string;
      inputId: string;
      inputMode: 'numeric' | 'decimal';
    };

interface Section {
  id: string;
  title: string;
  rows: Row[];
}

@Component({
  selector: 'app-question-form',
  imports: [
    FormField,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    SelectRow,
    SwitchRow,
  ],
  templateUrl: './question-form.html',
  styleUrl: './question-form.scss',
})
export class QuestionForm {
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly store = inject(PatientDataStore);
  protected readonly t = inject(TranslationService).t;

  protected readonly numberForm = form(this.store.numbers, (path) => {
    required(path.age);
    required(path.heightCm);
    required(path.weight);
    required(path.alb);
  });

  // Same sections and row order as the iOS and Android apps.
  protected readonly sections = computed<Section[]>(() => {
    const t = this.t();
    return [
      {
        id: 'basic-info',
        title: t.basicInfo,
        rows: [
          {
            kind: 'number',
            key: 'age',
            label: t.questionAgeTitle,
            inputId: 'age-input',
            inputMode: 'numeric',
          },
          {
            kind: 'select',
            key: 'sex',
            label: t.questionSexTitle,
            options: [
              { value: 'male', label: t.male },
              { value: 'female', label: t.female },
            ],
          },
          {
            kind: 'number',
            key: 'heightCm',
            label: t.questionHeightTitle,
            inputId: 'height-input',
            inputMode: 'decimal',
          },
          {
            kind: 'number',
            key: 'weight',
            label: t.questionWeightTitle,
            inputId: 'weight-input',
            inputMode: 'decimal',
          },
        ],
      },
      {
        id: 'social-history',
        title: t.socialHistory,
        rows: [
          {
            kind: 'switch',
            key: 'isSmoking',
            label: t.questionSmokingTitle,
            description: t.questionSmokingSubtitle,
          },
          {
            kind: 'select',
            key: 'activity',
            label: t.questionActivityTitle,
            description: t.questionActivitySubtitle,
            options: [
              { value: 'ambulatory', label: t.ambulatory },
              { value: 'wheelchair', label: t.wheelchair },
              { value: 'immobile', label: t.immobile },
            ],
          },
        ],
      },
      {
        id: 'clinical-info',
        title: t.clinicalInfo,
        rows: [
          {
            kind: 'number',
            key: 'alb',
            label: t.questionAlbTitle,
            inputId: 'alb-input',
            inputMode: 'decimal',
          },
          {
            kind: 'select',
            key: 'ckd',
            label: t.questionCKDTitle,
            description: t.questionCKDSubtitle,
            options: [
              { value: 'normal', label: t.normal },
              { value: 'g3', label: t.g3 },
              { value: 'g4', label: t.g4 },
              { value: 'g5', label: t.g5 },
              { value: 'g5D', label: t.g5D },
            ],
          },
          {
            kind: 'switch',
            key: 'isUrgent',
            label: t.questionUrgentTitle,
            description: t.questionUrgentSubtitle,
          },
          {
            kind: 'switch',
            key: 'hasFever',
            label: t.questionFeverTitle,
            description: t.questionFeverSubtitle,
          },
          {
            kind: 'switch',
            key: 'hasAbnormalWBC',
            label: t.questionAbnormalWBCTitle,
            description: t.questionAbnormalWBCSubtitle,
          },
          {
            kind: 'switch',
            key: 'hasLocalInfection',
            label: t.questionLocalInfectionTitle,
            description: t.questionLocalInfectionSubtitle,
          },
          {
            kind: 'select',
            key: 'rutherford',
            label: t.questionRutherfordTitle,
            options: [
              { value: 'class4', label: t.class4 },
              { value: 'class5', label: t.class5 },
              { value: 'class6', label: t.class6 },
            ],
          },
        ],
      },
      {
        id: 'lesion-info',
        title: t.lesionInfo,
        rows: [
          {
            kind: 'switch',
            key: 'hasAILesion',
            label: t.questionAILesionTitle,
            description: t.questionAILesionSubtitle,
          },
          {
            kind: 'switch',
            key: 'hasFPLesion',
            label: t.questionFPLesionTitle,
            description: t.questionFPLesionSubtitle,
          },
          {
            kind: 'switch',
            key: 'hasBKLesion',
            label: t.questionBKLesionTitle,
            description: t.questionBKLesionSubtitle,
          },
        ],
      },
      {
        id: 'other-lesion-info',
        title: t.otherLesionInfo,
        rows: [
          {
            kind: 'switch',
            key: 'hasContraLateralLesion',
            label: t.questionContraTitle,
            description: t.questionContraSubtitle,
          },
          {
            kind: 'switch',
            key: 'hasOtherVD',
            label: t.questionOtherLesionTitle,
            description: t.questionOtherLesionSubtitle,
          },
        ],
      },
      {
        id: 'complications',
        title: t.complications,
        rows: [
          {
            kind: 'switch',
            key: 'hasCHF',
            label: t.questionCHFTitle,
            description: t.questionCHFSubtitle,
          },
          {
            kind: 'switch',
            key: 'hasCAD',
            label: t.questionCADTitle,
            description: t.questionCADSubtitle,
          },
          {
            kind: 'switch',
            key: 'hasCVD',
            label: t.questionCVDTitle,
            description: t.questionCVDSubtitle,
          },
          {
            kind: 'switch',
            key: 'hasDyslipidemia',
            label: t.questionDLTitle,
            description: t.questionDLSubtitle,
          },
          {
            kind: 'select',
            key: 'malignant',
            label: t.questionMalignantTitle,
            description: t.questionMalignantSubtitle,
            options: [
              { value: 'no', label: t.noMalignancy },
              { value: 'pastHistory', label: t.pastHistory },
              { value: 'underTreatment', label: t.underTreatment },
            ],
          },
        ],
      },
    ];
  });

  protected boolValue(key: BooleanField): boolean {
    return this.store.data()[key];
  }

  protected setBool(key: BooleanField, checked: boolean): void {
    this.store.setField(key, checked);
  }

  protected enumValue(key: EnumField): string {
    return this.store.data()[key];
  }

  protected setEnum(key: EnumField, value: string): void {
    this.store.setField(key, value as PatientData[EnumField]);
  }

  protected numberField(key: NumericField): FieldTree<number | null> {
    return this.numberForm[key];
  }

  protected reset(): void {
    this.store.reset();
  }

  protected async analyze(): Promise<void> {
    const result = this.store.analyze();
    if (result.ok) {
      await this.router.navigateByUrl('/result');
      return;
    }
    const t = this.t();
    const message =
      result.source === 'NumberForm'
        ? t.analysisNullErrorMessage
        : result.source === 'LesionChoice'
          ? t.analysisLesionErrorMessage
          : t.analysisDefaultErrorMessage;
    this.snackBar.open(message, t.ok, { duration: 5000 });
  }
}
