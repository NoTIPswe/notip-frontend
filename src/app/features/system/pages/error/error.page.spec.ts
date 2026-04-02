import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, convertToParamMap } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { ErrorPageComponent } from './error.page';

describe('ErrorPageComponent', () => {
  let queryParamMapSubject: BehaviorSubject<ParamMap>;
  let routeMock: {
    snapshot: { queryParamMap: ParamMap };
    queryParamMap: Observable<ParamMap>;
  };

  beforeEach(async () => {
    queryParamMapSubject = new BehaviorSubject(convertToParamMap({}));
    routeMock = {
      snapshot: {
        queryParamMap: queryParamMapSubject.value,
      },
      queryParamMap: queryParamMapSubject.asObservable(),
    };

    await TestBed.configureTestingModule({
      imports: [ErrorPageComponent],
      providers: [{ provide: ActivatedRoute, useValue: routeMock }],
    }).compileComponents();
  });

  it('shows unauthorized message and retry path when provided', () => {
    const params = convertToParamMap({
      reason: 'unauthorized',
      retryUrl: '/dashboard',
    });
    routeMock.snapshot.queryParamMap = params;
    queryParamMapSubject.next(params);

    const fixture = TestBed.createComponent(ErrorPageComponent);
    fixture.detectChanges();

    const html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Sessione non autorizzata');
    expect(html.textContent).toContain('Percorso da ricaricare: /dashboard');
    expect(html.textContent).toContain('Ricarica pagina');
  });

  it('falls back to root when retryUrl is external', () => {
    const params = convertToParamMap({
      reason: 'unauthorized',
      retryUrl: 'https://example.com/evil',
    });
    routeMock.snapshot.queryParamMap = params;
    queryParamMapSubject.next(params);

    const fixture = TestBed.createComponent(ErrorPageComponent);
    const component = fixture.componentInstance;

    expect(component.retryUrl()).toBe('/');
  });

  it('updates content when query params change after component creation', () => {
    const fixture = TestBed.createComponent(ErrorPageComponent);
    fixture.detectChanges();

    let html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Errore applicativo');

    queryParamMapSubject.next(
      convertToParamMap({
        reason: 'unauthorized',
        retryUrl: '/dashboard',
      }),
    );
    fixture.detectChanges();

    html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Sessione non autorizzata');
    expect(html.textContent).toContain('Percorso da ricaricare: /dashboard');
    expect(fixture.componentInstance.reason()).toBe('unauthorized');
  });
});
