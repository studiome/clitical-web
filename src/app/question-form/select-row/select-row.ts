import { Component, computed, input, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';

export interface SelectOption {
  value: string;
  label: string;
}

// Module-level counter for deterministic, SSR/hydration-safe ids (no
// _IdGenerator, which is a private CDK API).
let nextSelectRowId = 0;

@Component({
  selector: 'app-select-row',
  imports: [MatFormFieldModule, MatSelectModule],
  templateUrl: './select-row.html',
  styleUrl: '../row.scss',
})
export class SelectRow {
  readonly label = input.required<string>();
  readonly description = input<string>('');
  readonly options = input.required<SelectOption[]>();
  readonly value = input.required<string>();
  readonly valueChange = output<string>();

  protected readonly descriptionId = `select-row-description-${nextSelectRowId++}`;

  // MatSelect's aria-describedby input is a plain property, but
  // MatFormField._syncDescribedByIds() reads/writes the DOM attribute, so
  // this must be an [attr.] binding for the id to actually land in the DOM.
  // [aria-label] already announces the label; without this, the visible
  // row-description text (e.g. the CKD eGFR ranges) is never read out.
  protected readonly ariaDescribedby = computed<string | null>(() =>
    this.description() ? this.descriptionId : null,
  );

  protected onChange(event: MatSelectChange<string>): void {
    this.valueChange.emit(event.value);
  }
}
