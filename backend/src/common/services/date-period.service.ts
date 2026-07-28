import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../../config/environment';

const DAY_IN_MS = 86_400_000;

export type DateRange = {
  from: Date;
  to: Date;
};

export type ComparablePeriods = {
  current: DateRange;
  previous: DateRange;
};

@Injectable()
export class DatePeriodService {
  private readonly timeZone: string;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    this.timeZone = config.get('APP_TIMEZONE', { infer: true });
  }

  getComparablePeriods(from?: string, to?: string, now = new Date()): ComparablePeriods {
    if ((from && !to) || (!from && to)) {
      throw new BadRequestException('Both from and to are required for a custom period.');
    }

    if (from && to) {
      const current = { from: this.parseDateOnly(from), to: this.parseDateOnly(to) };
      if (current.from > current.to) {
        throw new BadRequestException('from must be earlier than or equal to to.');
      }

      const inclusiveDuration = current.to.getTime() - current.from.getTime() + DAY_IN_MS;
      return {
        current,
        previous: {
          from: new Date(current.from.getTime() - inclusiveDuration),
          to: new Date(current.to.getTime() - inclusiveDuration),
        },
      };
    }

    const today = this.dateInConfiguredTimeZone(now);
    const daysSinceMonday = (today.getUTCDay() + 6) % 7;
    const monday = new Date(today.getTime() - daysSinceMonday * DAY_IN_MS);

    return {
      current: { from: monday, to: today },
      previous: {
        from: new Date(monday.getTime() - 7 * DAY_IN_MS),
        to: new Date(today.getTime() - 7 * DAY_IN_MS),
      },
    };
  }

  private parseDateOnly(value: string): Date {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`Invalid date: ${value}`);
    }
    return parsed;
  }

  private dateInConfiguredTimeZone(value: Date): Date {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(value);
    const part = (type: Intl.DateTimeFormatPartTypes): number =>
      Number(parts.find((item) => item.type === type)?.value);

    return new Date(Date.UTC(part('year'), part('month') - 1, part('day')));
  }
}
