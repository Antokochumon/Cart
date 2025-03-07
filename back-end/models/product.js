const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  Name: String,
  Category: String,
  Price: String,
  Description: String,
  Image: String, // Store the main image filename
  additionalImages: [String] // Store filenames of additional images
});

module.exports = mongoose.model('Product', productSchema);

