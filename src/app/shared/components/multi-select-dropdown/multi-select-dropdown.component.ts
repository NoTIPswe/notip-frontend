import { Component, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-multi-select-dropdown',
  standalone: true,
  templateUrl: './multi-select-dropdown.component.html',
  styleUrl: './multi-select-dropdown.component.css',
})
export class MultiSelectDropdownComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly options = input<string[]>([]);
  readonly selected = input<string[]>([]);
  readonly placeholder = input<string>('Select option');
  readonly searchPlaceholder = input<string>('Search...');
  readonly noResultsLabel = input<string>('No results');
  readonly disabled = input<boolean>(false);

  readonly selectedChange = output<string[]>();

  readonly isOpen = signal<boolean>(false);
  readonly searchTerm = signal<string>('');

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target;

    if (!(target instanceof Node)) {
      return;
    }

    if (this.host.nativeElement.contains(target)) {
      return;
    }

    this.closeMenu();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu();
  }

  toggleMenu(): void {
    if (this.disabled()) {
      return;
    }

    this.isOpen.update((open) => !open);
  }

  updateSearch(value: string): void {
    this.searchTerm.set(value);
  }

  toggleOption(value: string): void {
    if (this.disabled()) {
      return;
    }

    const current = this.selected();
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];

    this.selectedChange.emit(next);
  }

  isSelected(value: string): boolean {
    return this.selected().includes(value);
  }

  selectionLabel(): string {
    const selected = this.selected();

    if (selected.length === 0) {
      return this.placeholder();
    }

    if (selected.length === 1) {
      return selected[0];
    }

    return `${selected.length} selected`;
  }

  filteredOptions(): string[] {
    const search = this.searchTerm().trim().toLowerCase();
    const options = this.normalizedOptions();

    if (!search) {
      return options;
    }

    return options.filter((option) => option.toLowerCase().includes(search));
  }

  private normalizedOptions(): string[] {
    return this.options().filter((option) => typeof option === 'string' && option.length > 0);
  }

  private closeMenu(): void {
    if (!this.isOpen()) {
      return;
    }

    this.isOpen.set(false);
  }
}
