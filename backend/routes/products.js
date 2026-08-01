const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new product
router.post('/', async (req, res) => {
  const product = new Product({
    name: req.body.name,
    costPrice: req.body.costPrice,
    profitMargin: req.body.profitMargin,
    sellingPrice: (req.body.costPrice * (1 + req.body.profitMargin / 100)).toFixed(2),
    stock: req.body.stock,
    category: req.body.category,
    expiryDate: req.body.expiryDate,
    image: req.body.image,
    company: req.body.company,
  });

  try {
    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a product
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.name = req.body.name;
    product.costPrice = req.body.costPrice;
    product.profitMargin = req.body.profitMargin;
    product.sellingPrice = (req.body.costPrice * (1 + req.body.profitMargin / 100)).toFixed(2);
    product.stock = req.body.stock;
    product.category = req.body.category;
    product.expiryDate = req.body.expiryDate;
    product.image = req.body.image;
    product.company = req.body.company;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await product.deleteOne();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;