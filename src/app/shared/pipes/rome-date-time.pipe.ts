import { Pipe, PipeTransform } from '@angular/core';
import { formatRomeDateTime } from '../utils/rome-timezone.util';

@Pipe({
  name: 'romeDateTime',
  standalone: true,
})
export class RomeDateTimePipe implements PipeTransform {
  transform(
    value: string | number | Date | null | undefined,
    includeSeconds = true,
  ): string | null {
    return formatRomeDateTime(value, includeSeconds);
  }
}
