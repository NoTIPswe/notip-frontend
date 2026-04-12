import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MultiSelectDropdownComponent } from './multi-select-dropdown.component';

describe('MultiSelectDropdownComponent', () => {
  let fixture: ComponentFixture<MultiSelectDropdownComponent>;
  let component: MultiSelectDropdownComponent;

  const createClickEvent = (target: EventTarget | null): MouseEvent => {
    const event = new MouseEvent('click');
    Object.defineProperty(event, 'target', { value: target });
    return event;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiSelectDropdownComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MultiSelectDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('ignores document click when event target is not a Node', () => {
    component.isOpen.set(true);

    const clickEvent = createClickEvent({ notANode: true } as unknown as EventTarget);
    component.onDocumentClick(clickEvent);

    expect(component.isOpen()).toBe(true);
  });

  it('keeps menu open when document click happens inside component', () => {
    component.isOpen.set(true);

    const hostElement = fixture.nativeElement as HTMLElement;
    const insideTarget = hostElement.querySelector('.multi-select');

    if (!(insideTarget instanceof HTMLElement)) {
      throw new TypeError('Expected multi-select container in template');
    }

    component.onDocumentClick(createClickEvent(insideTarget));

    expect(component.isOpen()).toBe(true);
  });

  it('closes menu when document click happens outside component', () => {
    component.isOpen.set(true);

    component.onDocumentClick(createClickEvent(document.createElement('div')));

    expect(component.isOpen()).toBe(false);
  });

  it('closes menu on escape key', () => {
    component.isOpen.set(true);

    component.onEscape();

    expect(component.isOpen()).toBe(false);
  });

  it('keeps menu closed on escape when already closed', () => {
    expect(component.isOpen()).toBe(false);

    component.onEscape();

    expect(component.isOpen()).toBe(false);
  });

  it('toggles menu when enabled', () => {
    expect(component.isOpen()).toBe(false);

    component.toggleMenu();
    expect(component.isOpen()).toBe(true);

    component.toggleMenu();
    expect(component.isOpen()).toBe(false);
  });

  it('does not toggle menu when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    component.toggleMenu();

    expect(component.isOpen()).toBe(false);
  });

  it('updates search term', () => {
    component.updateSearch('temp');

    expect(component.searchTerm()).toBe('temp');
  });

  it('emits updated selection when adding and removing options', () => {
    const emitSpy = vi.spyOn(component.selectedChange, 'emit');

    fixture.componentRef.setInput('selected', ['alpha']);
    fixture.detectChanges();

    component.toggleOption('beta');
    expect(emitSpy).toHaveBeenCalledWith(['alpha', 'beta']);

    fixture.componentRef.setInput('selected', ['alpha', 'beta']);
    fixture.detectChanges();

    component.toggleOption('alpha');
    expect(emitSpy).toHaveBeenCalledWith(['beta']);
  });

  it('does not emit selection changes when disabled', () => {
    const emitSpy = vi.spyOn(component.selectedChange, 'emit');

    fixture.componentRef.setInput('disabled', true);
    fixture.componentRef.setInput('selected', ['alpha']);
    fixture.detectChanges();

    component.toggleOption('beta');

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('returns selected state for options', () => {
    fixture.componentRef.setInput('selected', ['alpha']);
    fixture.detectChanges();

    expect(component.isSelected('alpha')).toBe(true);
    expect(component.isSelected('beta')).toBe(false);
  });

  it('builds selection label for empty, single and multiple selections', () => {
    fixture.componentRef.setInput('placeholder', 'Choose items');
    fixture.componentRef.setInput('selected', []);
    fixture.detectChanges();
    expect(component.selectionLabel()).toBe('Choose items');

    fixture.componentRef.setInput('selected', ['alpha']);
    fixture.detectChanges();
    expect(component.selectionLabel()).toBe('alpha');

    fixture.componentRef.setInput('selected', ['alpha', 'beta']);
    fixture.detectChanges();
    expect(component.selectionLabel()).toBe('2 selected');
  });

  it('returns normalized options when search is empty', () => {
    fixture.componentRef.setInput('options', ['alpha', '', 'beta', 3 as unknown as string]);
    fixture.detectChanges();

    component.updateSearch('   ');

    expect(component.filteredOptions()).toEqual(['alpha', 'beta']);
  });

  it('filters options using trimmed case-insensitive search term', () => {
    fixture.componentRef.setInput('options', ['alpha', 'beta', 'gamma']);
    fixture.detectChanges();

    component.updateSearch('  BE  ');

    expect(component.filteredOptions()).toEqual(['beta']);
  });
});
