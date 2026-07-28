import { PrismaClient } from '@prisma/client';
import { seedDemoReviews } from './seed/demo-reviews';

const prisma = new PrismaClient();

const properties = [
  {
    slug: 'surry-hills',
    name: 'Surry Hills',
    bookingUrl: 'https://www.booking.com/hotel/au/sydney-city-stay.html',
  },
  {
    slug: 'potts-point',
    name: 'Potts Point',
    bookingUrl: 'https://www.booking.com/hotel/au/venus-potts-point-sydney.html',
  },
  {
    slug: 'central-sydney',
    name: 'Central Sydney',
    bookingUrl: 'https://www.booking.com/hotel/au/venus-surry-hills.html',
  },
  {
    slug: 'darling-harbour',
    name: 'Darling Harbour',
    bookingUrl: 'https://www.booking.com/hotel/au/chateau-de-venus.html',
  },
] as const;

const topics = [
  ['cleanliness', 'Cleanliness', 'Room and shared-area cleanliness or hygiene.'],
  ['check-in', 'Check-in experience', 'Arrival, access, keys, and check-in experience.'],
  ['staff', 'Staff or receptionist behaviour', 'Service and interactions with hotel staff.'],
  ['noise', 'Noise', 'Internal or external noise and guest disturbance.'],
  ['facilities', 'Facilities', 'Hotel amenities, utilities, and shared facilities.'],
  ['location', 'Location', 'Convenience, transport, and surrounding area.'],
  ['room-condition', 'Room condition', 'Room fixtures, comfort, size, and maintenance.'],
  ['value', 'Value for money', 'Price, affordability, and perceived value.'],
] as const;

async function seed(): Promise<number> {
  // Upserts make the command safe to rerun in local and demo environments.
  await prisma.$transaction([
    ...properties.map((property) =>
      prisma.property.upsert({
        where: { slug: property.slug },
        update: {
          name: property.name,
          bookingUrl: property.bookingUrl,
          active: true,
        },
        create: property,
      }),
    ),
    ...topics.map(([key, displayName, description]) =>
      prisma.topic.upsert({
        where: { key },
        update: { displayName, description, active: true },
        create: { key, displayName, description },
      }),
    ),
  ]);

  return seedDemoReviews(prisma);
}

seed()
  .then((reviewCount) => {
    console.info(
      `Seeded ${properties.length} properties, ${topics.length} topics, and ${reviewCount} synthetic demo reviews.`,
    );
  })
  .catch((error: unknown) => {
    console.error('Database seed failed.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
