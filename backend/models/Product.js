const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  costPrice: { type: Number, required: true },
  profitMargin: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  stock: { type: Number, required: true },
  category: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  image: { type: String },
  company: { type: String, required: false },
});

module.exports = mongoose.model('Product', productSchema);