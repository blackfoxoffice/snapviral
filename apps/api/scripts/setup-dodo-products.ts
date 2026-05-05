/**
 * One-shot script to provision the Newsflow Studio plans on Dodo Payments.
 * Idempotent — re-running checks for existing products by name and reuses them.
 *
 * Usage:
 *   pnpm --filter @newsflow/api exec tsx scripts/setup-dodo-products.ts
 */
import 'dotenv/config';
import { createProductsIfMissing } from '../src/services/billing.js';

async function main() {
  if (!process.env.DODO_PAYMENTS_API_KEY) {
    console.error('DODO_PAYMENTS_API_KEY is not set. Aborting.');
    process.exit(1);
  }

  console.log('[dodo] env =', process.env.DODO_PAYMENTS_ENVIRONMENT ?? 'test_mode');
  const result = await createProductsIfMissing();

  console.log('\nCreated:');
  for (const line of result.created) console.log('  ✓', line);
  console.log('\nAlready existed:');
  for (const line of result.existed) console.log('  -', line);
  console.log('\nDone.');
}

main().catch((e) => {
  console.error('setup-dodo-products failed:', e);
  process.exit(1);
});
