import { toInputDate } from './format';

export const EMPTY_FORM = {
  name: '', costPrice: '', sellingPrice: '', profitMargin: '20', stock: '', category: '', company: '',
  expiryDate: '', barcode: '', imageUrl: '', imagePublicId: '',
  promoPercent: '', promoEndsAt: '', isFeatured: false,
};

export function productToForm(p) {
  return {
    name: p.name,
    costPrice: String(p.costPrice),
    sellingPrice: String(p.sellingPrice),
    profitMargin: String(p.profitMargin),
    stock: String(p.stock),
    category: p.category,
    company: p.company || '',
    expiryDate: p.expiryDate ? toInputDate(p.expiryDate) : '',
    barcode: p.barcode || '',
    imageUrl: p.imageUrl || '',
    imagePublicId: p.imagePublicId || '',
    promoPercent: p.promoPercent ? String(p.promoPercent) : '',
    promoEndsAt: p.promoEndsAt ? toInputDate(p.promoEndsAt) : '',
    isFeatured: !!p.isFeatured,
  };
}