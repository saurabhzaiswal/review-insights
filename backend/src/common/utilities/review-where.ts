import { Prisma } from '@prisma/client';
import { DateRange } from '../services/date-period.service';

export function reviewWhereForPeriod(
  range: DateRange,
  propertyIds?: string[],
): Prisma.ReviewWhereInput {
  return {
    propertyId: propertyIds?.length ? { in: propertyIds } : undefined,
    reviewDate: {
      gte: range.from,
      lte: range.to,
    },
  };
}
