import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientsService } from '../../services/clients.service';
import { ApiClientListPageComponent } from './api-client-list.page';

describe('ApiClientListPageComponent', () => {
  const clientsServiceMock = {
    getClients: vi.fn(),
    createClient: vi.fn(),
    deleteClient: vi.fn(),
  };

  beforeEach(async () => {
    clientsServiceMock.getClients.mockReset();
    clientsServiceMock.createClient.mockReset();
    clientsServiceMock.deleteClient.mockReset();

    clientsServiceMock.getClients.mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ApiClientListPageComponent],
      providers: [{ provide: ClientsService, useValue: clientsServiceMock }],
    }).compileComponents();
  });

  it('shows create error inside modal form and not in page error area', () => {
    clientsServiceMock.createClient.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { message: 'Unable to create API client credentials.' },
          }),
      ),
    );

    const fixture = TestBed.createComponent(ApiClientListPageComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();

    component.errorMessage.set('Unable to load API clients.');
    component.showCreateForm.set(true);
    fixture.detectChanges();

    component.createClient('client one');
    fixture.detectChanges();

    const html = fixture.nativeElement as HTMLElement;
    const formError = html.querySelector('.create-form .form-error');
    const pageError = html.querySelector('.api-client-page > .error');

    expect(component.showCreateForm()).toBe(true);
    expect(component.formErrorMessage()).toBe('Unable to create API client credentials.');
    expect(formError?.textContent).toContain('Unable to create API client credentials.');
    expect(pageError).toBeNull();
  });
});
