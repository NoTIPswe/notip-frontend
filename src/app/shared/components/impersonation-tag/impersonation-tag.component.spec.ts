import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ImpersonationTagComponent } from './impersonation-tag.component';

describe('ImpersonationTagComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<ImpersonationTagComponent>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImpersonationTagComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImpersonationTagComponent);
  });

  it('renders obfuscated mode warning text', () => {
    fixture.detectChanges();

    const tag = (fixture.nativeElement as HTMLElement).querySelector('.tag');
    expect(tag?.textContent).toContain('OBFUSCATED MODE');
  });
});
