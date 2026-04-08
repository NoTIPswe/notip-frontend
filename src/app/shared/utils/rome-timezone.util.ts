export const ROME_TIME_ZONE = 'Europe/Rome';

type DateInput = string | number | Date | null | undefined;

type RomeDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const DATETIME_LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

const romeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: ROME_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

export function formatRomeDateTime(value: DateInput, includeSeconds = true): string | null {
  const parsed = parseDate(value);

  if (!parsed) {
    return null;
  }

  const parts = getRomeDateParts(parsed);

  if (!parts) {
    return null;
  }

  const secondsPart = includeSeconds ? `:${pad(parts.second)}` : '';

  return `${pad(parts.day)}/${pad(parts.month)}/${parts.year} - ${pad(parts.hour)}:${pad(parts.minute)}${secondsPart}`;
}

export function toRomeDateTimeInput(value: DateInput): string {
  const parsed = parseDate(value);

  if (!parsed) {
    return '';
  }

  const parts = getRomeDateParts(parsed);

  if (!parts) {
    return '';
  }

  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function fromRomeDateTimeInputToIso(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const localParts = parseDateTimeLocal(value.trim());

  if (!localParts) {
    return undefined;
  }

  const targetLocalMs = Date.UTC(
    localParts.year,
    localParts.month - 1,
    localParts.day,
    localParts.hour,
    localParts.minute,
    localParts.second,
  );

  let utcMs = targetLocalMs;

  // Iteratively solve local Rome wall-clock time -> UTC instant while respecting DST.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const represented = getRomeDateParts(new Date(utcMs));

    if (!represented) {
      return undefined;
    }

    const representedLocalMs = Date.UTC(
      represented.year,
      represented.month - 1,
      represented.day,
      represented.hour,
      represented.minute,
      represented.second,
    );

    const diffMs = targetLocalMs - representedLocalMs;

    if (diffMs === 0) {
      return new Date(utcMs).toISOString();
    }

    utcMs += diffMs;
  }

  return undefined;
}

function parseDate(value: DateInput): Date | null {
  if (value == null || value === '') {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function getRomeDateParts(value: Date): RomeDateParts | null {
  const partByType = new Map<string, string>();

  for (const part of romeFormatter.formatToParts(value)) {
    if (part.type !== 'literal') {
      partByType.set(part.type, part.value);
    }
  }

  const year = Number(partByType.get('year'));
  const month = Number(partByType.get('month'));
  const day = Number(partByType.get('day'));
  const hour = Number(partByType.get('hour'));
  const minute = Number(partByType.get('minute'));
  const second = Number(partByType.get('second'));

  if ([year, month, day, hour, minute, second].some((chunk) => !Number.isFinite(chunk))) {
    return null;
  }

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
  };
}

function parseDateTimeLocal(value: string): RomeDateParts | null {
  const match = DATETIME_LOCAL_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? '0');

  if (![year, month, day, hour, minute, second].every((chunk) => Number.isInteger(chunk))) {
    return null;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
    return null;
  }

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
  };
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
