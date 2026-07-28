import { Prisma } from '@prisma/client';

export function decimalToNumber(value: Prisma.Decimal | null | undefined): number | null {
  return value === null || value === undefined ? null : Number(value);
}

export function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}
