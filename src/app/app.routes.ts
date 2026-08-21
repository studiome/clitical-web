import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./question-form/question-form').then((m) => m.QuestionForm),
  },
  {
    path: 'result',
    loadComponent: () => import('./risk-view/risk-view').then((m) => m.RiskView),
  },
  {
    path: 'batch',
    loadComponent: () =>
      import('./batch-processing/batch-processing').then((m) => m.BatchProcessing),
  },
  {
    path: 'references',
    loadComponent: () => import('./references/references').then((m) => m.References),
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings').then((m) => m.Settings),
  },
  { path: '**', redirectTo: '' },
];
