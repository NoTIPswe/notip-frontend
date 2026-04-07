import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Costs } from '../../../../../core/models/costs';
import { CostCardComponent } from './cost-card.component';

describe('CostCardComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<CostCardComponent>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CostCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CostCardComponent);
  });

  it('shows loading message while costs are loading', () => {
    fixture.componentRef.setInput('isLoading', true);
    fixture.detectChanges();

    const meta = (fixture.nativeElement as HTMLElement).querySelector('.meta');
    expect(meta?.textContent).toContain('Loading costs...');
  });

  it('does not render cost breakdown when costs are null', () => {
    fixture.componentRef.setInput('costs', null);
    fixture.detectChanges();

    const breakdown = (fixture.nativeElement as HTMLElement).querySelector('dl');
    expect(breakdown).toBeNull();
  });

  it('renders storage, bandwidth and total values', () => {
    const costs: Costs = {
      storageGb: 1.5,
      bandwidthGb: 2.25,
    };

    fixture.componentRef.setInput('costs', costs);
    fixture.detectChanges();

    const values = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('dd')).map(
      (node) => node.textContent?.trim(),
    );

    expect(values[0]).toBe('1.50 GB');
    expect(values[1]).toBe('2.25 GB');
    expect(values[2]).toBe('3.75 GB');
  });

  it('normalizes non-finite values to zero', () => {
    const costs: Costs = {
      storageGb: Number.NaN,
      bandwidthGb: Number.POSITIVE_INFINITY,
    };

    fixture.componentRef.setInput('costs', costs);
    fixture.detectChanges();

    const values = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('dd')).map(
      (node) => node.textContent?.trim(),
    );

    expect(values[0]).toBe('0.00 GB');
    expect(values[1]).toBe('0.00 GB');
    expect(values[2]).toBe('0.00 GB');
  });
});
