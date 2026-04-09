import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserTableComponent } from './user-table.component';

describe('UserTableComponent', () => {
  let component: UserTableComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserTableComponent],
    }).compileComponents();

    component = TestBed.createComponent(UserTableComponent).componentInstance;
  });

  it('emits edit and delete requests with user id', () => {
    const editSpy = vi.spyOn(component.editRequested, 'emit');
    const deleteSpy = vi.spyOn(component.deleteRequested, 'emit');

    component.requestEdit('user-1');
    component.requestDelete('user-1');

    expect(editSpy).toHaveBeenCalledWith('user-1');
    expect(deleteSpy).toHaveBeenCalledWith('user-1');
  });

  it('formats UTC timestamps to Europe/Rome for display', () => {
    expect(component.formatLastAccess('2026-04-07T10:15:30.000Z')).toBe('07/04/2026 12:15:30');
  });

  it('applies winter offset in Europe/Rome timezone', () => {
    expect(component.formatLastAccess('2026-01-07T10:15:30.000Z')).toBe('07/01/2026 11:15:30');
  });

  it('returns dash when last access is missing', () => {
    expect(component.formatLastAccess(null)).toBe('-');
  });

  it('returns original value when timestamp is invalid', () => {
    expect(component.formatLastAccess('not-a-date')).toBe('not-a-date');
  });
});
