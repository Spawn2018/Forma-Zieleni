const BANNED = /production customer dump|live customer export|customer database copy/i;

export function assertSafeTestData(value) {
  const text = JSON.stringify(value);
  if (BANNED.test(text)) throw new Error('CUSTOMER_DUMP');
  if (value && typeof value === 'object' && value.kind === 'marketing-plan' && value.synthetic !== true) {
    throw new Error('SYNTHETIC_LABEL_REQUIRED');
  }
  return value;
}
