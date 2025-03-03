const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  Category: { type: String, required: true },
  Price: { type: Number, required: true },
  Description: { type: String, required: true },
  Image: { type: String, required: true }, // Main image
  additionalImages: [{ type: String }], // Array of additional images
});

module.exports = mongoose.model('Product', productSchema);

