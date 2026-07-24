import { Component, input, output } from '@angular/core';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-switch-row',
  imports: [MatSlideToggleModule],
  template: `
    <div class="row">
      <div class="row-text">
        <span class="row-label">{{ label() }}</span>
        @if (description()) {
          <span class="row-description">{{ description() }}</span>
        }
      </div>
      <mat-slide-toggle
        [checked]="checked()"
        [aria-label]="label()"
        (change)="onChange($event)"
      />
    </div>
  `,
  styleUrl: './row.scss',
})
export class SwitchRow {
  readonly label = input.required<string>();
  readonly description = input<string>('');
  readonly checked = input.required<boolean>();
  readonly checkedChange = output<boolean>();

  protected onChange(event: MatSlideToggleChange): void {
    this.checkedChange.emit(event.checked);
  }
}
