import { Component, input, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-select-row',
  imports: [MatFormFieldModule, MatSelectModule],
  template: `
    <div class="row">
      <div class="row-text">
        <span class="row-label">{{ label() }}</span>
        @if (description()) {
          <span class="row-description">{{ description() }}</span>
        }
      </div>
      <mat-form-field appearance="outline" class="row-control" subscriptSizing="dynamic">
        <mat-select
          [value]="value()"
          [aria-label]="label()"
          (selectionChange)="onChange($event)"
        >
          @for (option of options(); track option.value) {
            <mat-option [value]="option.value">{{ option.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>
  `,
  styleUrl: './row.scss',
})
export class SelectRow {
  readonly label = input.required<string>();
  readonly description = input<string>('');
  readonly options = input.required<SelectOption[]>();
  readonly value = input.required<string>();
  readonly valueChange = output<string>();

  protected onChange(event: MatSelectChange<string>): void {
    this.valueChange.emit(event.value);
  }
}
