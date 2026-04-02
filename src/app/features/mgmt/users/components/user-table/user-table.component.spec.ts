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
});
