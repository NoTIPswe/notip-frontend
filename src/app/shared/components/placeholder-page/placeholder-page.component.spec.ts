import { ActivatedRoute } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { PlaceholderPageComponent } from './placeholder-page.component';

describe('PlaceholderPageComponent', () => {
  const routeData: Record<string, unknown> = {};

  beforeEach(async () => {
    for (const key of Object.keys(routeData)) {
      delete routeData[key];
    }

    await TestBed.configureTestingModule({
      imports: [PlaceholderPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: routeData,
            },
          },
        },
      ],
    }).compileComponents();
  });

  it('renders title from route data', () => {
    routeData['title'] = 'Audit';
    const fixture = TestBed.createComponent(PlaceholderPageComponent);

    fixture.detectChanges();

    const title = (fixture.nativeElement as HTMLElement).querySelector('h2');
    expect(title?.textContent).toContain('Audit');
  });

  it('falls back to default title when route title is missing', () => {
    routeData['title'] = null;
    const fixture = TestBed.createComponent(PlaceholderPageComponent);

    fixture.detectChanges();

    const title = (fixture.nativeElement as HTMLElement).querySelector('h2');
    expect(title?.textContent).toContain('NoTIP');
  });
});
