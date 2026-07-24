import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/question-form/question-form').then((m) => m.QuestionForm),
  },
  {
    path: 'result',
    loadComponent: () =>
      import('./pages/risk-view/risk-view').then((m) => m.RiskView),
  },
  { path: '**', redirectTo: '' },
];
