const mongoose = require('mongoose');

const sizeSchema = new mongoose.Schema(
  {
    ml: { type: Number, required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

const notesSchema = new mongoose.Schema(
  {
    top: [String],
    heart: [String],
    base: [String],
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Produktname ist erforderlich'],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, 'Marke ist erforderlich'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Preis ist erforderlich'],
      min: [0, 'Preis darf nicht negativ sein'],
    },
    sizes: {
      type: [sizeSchema],
      default: [],
    },
    category: {
      type: String,
      required: true,
      enum: ['Herren', 'Damen', 'Unisex'],
      trim: true,
    },
    notes: {
      type: notesSchema,
      default: {},
    },
    images: {
      type: [String],
      default: [],
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema);
