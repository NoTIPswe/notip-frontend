import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<StatusBadgeComponent>>;
  let component: StatusBadgeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBadgeComponent);
    component = fixture.componentInstance;
  });

  it.each([
    ['online', 'is-good'],
    ['ACK', 'is-good'],
    ['paused', 'is-warn'],
    ['queued', 'is-warn'],
    ['offline', 'is-bad'],
    ['timeout', 'is-bad'],
    ['other', 'is-neutral'],
  ])('maps %s to %s', (status, expectedClass) => {
    fixture.componentRef.setInput('status', status);
    fixture.detectChanges();

    expect(component.badgeClass()).toBe(expectedClass);
  });
});
