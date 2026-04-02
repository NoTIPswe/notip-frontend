import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientTableComponent } from './api-client-table.component';

describe('ApiClientTableComponent', () => {
  let component: ApiClientTableComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApiClientTableComponent],
    }).compileComponents();

    component = TestBed.createComponent(ApiClientTableComponent).componentInstance;
  });

  it('emits delete request with selected client id', () => {
    const emitSpy = vi.spyOn(component.deleteRequested, 'emit');

    component.requestDelete('client-1');

    expect(emitSpy).toHaveBeenCalledWith('client-1');
  });
});
