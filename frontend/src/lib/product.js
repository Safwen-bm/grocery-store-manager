export function productToForm(p) {
  return {
    name: p.name,
    costPrice: String(p.costPrice),
    profitMargin: String(p.profitMargin),
    stock: String(p.stock),
    category: p.category,
    company: p.company || '',
    expiryDate: p.expiryDate.split('T')[0],
    image: p.image || null,
  };
}
