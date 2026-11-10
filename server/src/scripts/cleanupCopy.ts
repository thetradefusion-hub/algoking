import { connectDatabase } from '../config/db.js';
import { Plan } from '../models/Plan.js';

async function main() {
  await connectDatabase();

  const updates = [
    {
      slug: 'starter-growth',
      description: 'Starter investment plan',
      riskDisclosure: '',
    },
    {
      slug: 'prime-builder',
      description: 'Prime investment plan',
      riskDisclosure: '',
    },
    {
      slug: 'royal-wealth',
      description: 'Royal investment plan',
      riskDisclosure: '',
    },
  ];

  for (const item of updates) {
    await Plan.updateOne(
      { slug: item.slug },
      { $set: { description: item.description, riskDisclosure: item.riskDisclosure } }
    );
  }

  // Fallback for any other plans with disclaimer-style copy
  await Plan.updateMany(
    {
      $or: [
        { description: /illustrative|non-guaranteed|demo projection/i },
        { riskDisclosure: /illustrative|demo\/sandbox|please review/i },
      ],
    },
    { $set: { riskDisclosure: '' } }
  );

  console.log('Plan copy cleaned');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
