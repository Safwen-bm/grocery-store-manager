export const formatDate = (d) => new Date(d).toLocaleDateString('fr-TN');
export const formatPrice = (n) => `${Number(n).toFixed(2)} د.ت`;
export const LOW_STOCK = 10;

export function expiryState(d) {
  const days = Math.ceil((new Date(d) - Date.now()) / 86400000);
  if (days < 0) return 'expired';
  if (days <= 30) return 'soon';
  return 'ok';
}
