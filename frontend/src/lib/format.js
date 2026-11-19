export const LOW_STOCK = 10;
export const formatDate = (d) => new Date(d).toLocaleDateString('fr-TN');
export const formatDateTime = (d) => new Date(d).toLocaleString('fr-TN', { dateStyle: 'short', timeStyle: 'short' });
export const formatPrice = (n) => `${Number(n ?? 0).toFixed(2)} د.ت`;
export const daysUntil = (d) => Math.ceil((new Date(d) - Date.now()) / 86400000);

export function expiryState(d) {
  const days = daysUntil(d);
  if (days < 0) return 'expired';
  if (days <= 30) return 'soon';
  return 'ok';
}

export function toInputDate(d = new Date()) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}