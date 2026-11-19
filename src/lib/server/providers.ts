import 'server-only';
import type { PaymentProvider, TransactionalEmail } from './contracts';
// Intentionally unavailable. Add a reviewed, tested adapter only after choosing real providers.
// No environment variable alone can turn these into a fake live payment/email integration.
export function paymentProvider():PaymentProvider|null {return null;}
export function emailProvider():TransactionalEmail|null {return null;}
