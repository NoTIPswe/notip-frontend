import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { ErrorPageComponent } from './error.page';

describe('ErrorPageComponent', () => {
  const routeMock = {
    snapshot: {
      queryParamMap: convertToParamMap({}),
    },
  };

  beforeEach(async () => {
    routeMock.snapshot.queryParamMap = convertToParamMap({});

    await TestBed.configureTestingModule({
      imports: [ErrorPageComponent],
      providers: [{ provide: ActivatedRoute, useValue: routeMock }],
    }).compileComponents();
  });

  it('shows unauthorized message and retry path when provided', () => {
    routeMock.snapshot.queryParamMap = convertToParamMap({
      reason: 'unauthorized',
      retryUrl: '/dashboard',
    });

    const fixture = TestBed.createComponent(ErrorPageComponent);
    fixture.detectChanges();

    const html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Sessione non autorizzata');
    expect(html.textContent).toContain('Percorso da ricaricare: /dashboard');
    expect(html.textContent).toContain('Ricarica pagina');
  });

  it('falls back to root when retryUrl is external', () => {
    routeMock.snapshot.queryParamMap = convertToParamMap({
      reason: 'unauthorized',
      retryUrl: 'https://example.com/evil',
    });

    const fixture = TestBed.createComponent(ErrorPageComponent);
    const component = fixture.componentInstance;

    expect(component.retryUrl).toBe('/');
  });
});
