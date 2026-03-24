const router = require('express').Router();
const isAdmin = require('../middleware/isAdmin');
const Product = require('../models/Product');
const Order = require('../models/Order');

// ── Produkte ──────────────────────────────────────────────────────────────

router.get('/products', isAdmin, async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});

router.post('/products', isAdmin, async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

router.put('/products/:id', isAdmin, async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id, req.body, { new: true }
  );
  res.json(product);
});

router.delete('/products/:id', isAdmin, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: 'Gelöscht' });
});

// ── Bestellungen ──────────────────────────────────────────────────────────

router.get('/orders', isAdmin, async (req, res) => {
  const orders = await Order.find()
    .populate('user', 'email')
    .sort({ createdAt: -1 });
  res.json(orders);
});

router.put('/orders/:id/status', isAdmin, async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  res.json(order);
});

module.exports = router;
