import { Component, computed, input, output } from '@angular/core';
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
      @if (stateText(); as state) {
        <!--
          Material 3 switch guidance: a visible on/off label is optional and
          only worth adding when the state isn't self-evident (here, "on"
          means the clinical finding is present, not a generic
          enabled/disabled toggle). Because mat-slide-toggle already exposes
          role="switch" + aria-checked, this text is aria-hidden so screen
          readers don't announce the state twice.
        -->
        <span class="row-state" aria-hidden="true">{{ state }}</span>
      }
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
  readonly onLabel = input<string>('');
  readonly offLabel = input<string>('');
  readonly checkedChange = output<boolean>();

  protected readonly stateText = computed(() => {
    if (!this.onLabel() && !this.offLabel()) return '';
    return this.checked() ? this.onLabel() : this.offLabel();
  });

  protected onChange(event: MatSlideToggleChange): void {
    this.checkedChange.emit(event.checked);
  }
}
