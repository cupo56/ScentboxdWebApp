const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /api/products – Alle Produkte abrufen
router.get('/', async (req, res) => {
  try {
    const { category, brand, sort, limit = 20, page = 1 } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (brand) filter.brand = { $regex: brand, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);

    let sortOption = { createdAt: -1 };
    if (sort) {
      if (sort.startsWith('-')) {
        sortOption = { [sort.slice(1)]: -1 };
      } else {
        sortOption = { [sort]: 1 };
      }
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      total,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server-Fehler', error: err.message });
  }
});

// GET /api/products/:id – Einzelnes Produkt abrufen
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produkt nicht gefunden' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server-Fehler', error: err.message });
  }
});

module.exports = router;
