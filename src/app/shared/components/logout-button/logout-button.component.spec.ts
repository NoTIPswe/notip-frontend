import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LogoutButtonComponent } from './logout-button.component';

describe('LogoutButtonComponent', () => {
  let component: LogoutButtonComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogoutButtonComponent],
    }).compileComponents();

    component = TestBed.createComponent(LogoutButtonComponent).componentInstance;
  });

  it('emits click event', () => {
    const emitSpy = vi.spyOn(component.clicked, 'emit');

    component.onClick();

    expect(emitSpy).toHaveBeenCalledOnce();
  });
});
