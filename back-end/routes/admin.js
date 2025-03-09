const express = require('express');
const router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Set up storage for images using multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/product-images/')); // Ensure this path is correct
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});

const upload = multer({ storage: storage });

// Admin Dashboard - View Products
router.get('/', async (req, res) => {
    try {
        let products = await productHelpers.getAllProducts();
        res.render('admin/view-products', { admin: true, products });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).send('Server error');
    }
});

// Render Add Product Page
router.get('/add-product', (req, res) => {
    res.render('admin/add-product');
});

// Handle Add Product
router.post('/add-product', upload.fields([
    { name: 'Image', maxCount: 1 }, // Main image
    { name: 'additionalImages', maxCount: 5 } // Additional images
]), async (req, res) => {
    try {
        let product = req.body;

        // Save the main image
        if (req.files['Image']) {
            product.Image = req.files['Image'][0].filename; // Save main image filename
        } else {
            return res.status(400).send('No main image uploaded');
        }

        // Save additional images
        if (req.files['additionalImages']) {
            product.additionalImages = req.files['additionalImages'].map(file => file.filename); // Save additional image filenames
        } else {
            product.additionalImages = []; // Empty array if no additional images
        }

        console.log("Product data before saving:", product);
        await productHelpers.addProduct(product);
        res.redirect('/admin');
    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).send("Error adding product");
    }
});

// Delete Product
router.get('/delete-product/:id', async (req, res) => {
    try {
        let productId = req.params.id;
        console.log("Deleting product:", productId);

        // Fetch the product to get image filenames
        let product = await productHelpers.getProductDetails(productId);
        if (!product) {
            return res.status(404).send('Product not found');
        }

        // Delete the main image
        if (product.Image) {
            let imagePath = path.join(__dirname, '../public/product-images', product.Image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // Delete additional images
        if (product.additionalImages && product.additionalImages.length > 0) {
            product.additionalImages.forEach(image => {
                let imagePath = path.join(__dirname, '../public/product-images', image);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            });
        }

        // Delete the product from the database
        await productHelpers.deleteProduct(productId);
        res.redirect('/admin');
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).send('Server error');
    }
});

// Render Edit Product Page
router.get('/edit-product/:id', async (req, res) => {
    try {
        let product = await productHelpers.getProductDetails(req.params.id);
        if (!product) {
            return res.status(404).send('Product not found');
        }
        res.render('admin/edit-product', { product });
    } catch (error) {
        console.error("Error fetching product details:", error);
        res.status(500).send('Server error');
    }
});

// Handle Edit Product
router.post('/edit-product/:id', upload.fields([
    { name: 'Image', maxCount: 1 }, // Main image
    { name: 'additionalImages', maxCount: 5 } // Additional images
]), async (req, res) => {
    try {
        let productId = req.params.id;
        let productData = req.body;

        // Fetch the existing product to get old image filenames
        let existingProduct = await productHelpers.getProductDetails(productId);
        if (!existingProduct) {
            return res.status(404).send('Product not found');
        }

        // Update the main image if a new one is uploaded
        if (req.files['Image']) {
            // Delete the old main image
            if (existingProduct.Image) {
                let oldImagePath = path.join(__dirname, '../public/product-images', existingProduct.Image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }

            // Save the new main image
            productData.Image = req.files['Image'][0].filename;
        } else {
            // Keep the existing main image
            productData.Image = existingProduct.Image;
        }

        // Update additional images if new ones are uploaded
        if (req.files['additionalImages']) {
            // Delete the old additional images
            if (existingProduct.additionalImages && existingProduct.additionalImages.length > 0) {
                existingProduct.additionalImages.forEach(image => {
                    let oldImagePath = path.join(__dirname, '../public/product-images', image);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                });
            }

            // Save the new additional images
            productData.additionalImages = req.files['additionalImages'].map(file => file.filename);
        } else {
            // Keep the existing additional images
            productData.additionalImages = existingProduct.additionalImages;
        }

        // Update the product in the database
        await productHelpers.updateProduct(productId, productData);
        res.redirect('/admin');
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).send('Server error');
    }
});

// Remove additional image
router.delete('/remove-additional-image/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const imageName = req.query.imageName;

        // Fetch the product
        const product = await productHelpers.getProductDetails(productId);
        if (!product) {
            return res.status(404).send('Product not found');
        }

        // Remove the image from the file system
        const imagePath = path.join(__dirname, '../public/product-images', imageName);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        // Remove the image from the product's additionalImages array
        const updatedAdditionalImages = product.additionalImages.filter(image => image !== imageName);
        await productHelpers.updateProduct(productId, { additionalImages: updatedAdditionalImages });

        res.status(200).send('Image removed successfully');
    } catch (error) {
        console.error('Error removing additional image:', error);
        res.status(500).send('Server error');
    }
});

module.exports = router;
