import { Component, computed, input, output } from '@angular/core';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';

// Module-level counter for deterministic, SSR/hydration-safe ids (no
// _IdGenerator, which is a private CDK API).
let nextSwitchRowId = 0;

@Component({
  selector: 'app-switch-row',
  imports: [MatSlideToggleModule],
  templateUrl: './switch-row.html',
  styleUrl: '../row.scss',
})
export class SwitchRow {
  readonly label = input.required<string>();
  readonly description = input<string>('');
  readonly checked = input.required<boolean>();
  readonly onLabel = input<string>('');
  readonly offLabel = input<string>('');
  readonly checkedChange = output<boolean>();

  protected readonly descriptionId = `switch-row-description-${nextSwitchRowId++}`;

  // MatSlideToggle's aria-describedby input is typed as a plain string, but
  // its default value is undefined at runtime, which is what keeps the host
  // attribute unset; the cast preserves that (passing '' would set an empty
  // attribute instead of omitting it).
  // [aria-label] already announces the label; without this, the visible
  // row-description text (e.g. clinical criteria) is never read out.
  protected readonly ariaDescribedby = computed<string>(
    () => (this.description() ? this.descriptionId : undefined) as string,
  );

  protected readonly stateText = computed(() => {
    if (!this.onLabel() && !this.offLabel()) return '';
    return this.checked() ? this.onLabel() : this.offLabel();
  });

  protected onChange(event: MatSlideToggleChange): void {
    this.checkedChange.emit(event.checked);
  }
}
