const express = require('express');
const router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const path = require('path');
const fs = require('fs');

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
router.post('/add-product', async (req, res) => {
    try {
        console.log(req.body);

        if (!req.files || !req.files.Image) {
            return res.status(400).send('No image uploaded');
        }

        let productData = req.body;
        let image = req.files.Image;

        let productId = await productHelpers.addProduct(productData);

        let uploadPath = path.join(__dirname, '../public/product-images', `${productId}.jpg`);
        
        if (!fs.existsSync(path.dirname(uploadPath))) {
            fs.mkdirSync(path.dirname(uploadPath), { recursive: true });
        }

        image.mv(uploadPath, (err) => {
            if (err) {
                console.error("Image upload failed:", err);
                return res.status(500).send('Image upload failed');
            }
            res.redirect('/admin');
        });
    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).send('Server error');
    }
});

// Delete Product
router.get('/delete-product/:id', async (req, res) => {
    try {
        let productId = req.params.id;
        console.log("Deleting product:", productId);

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
        res.render('admin/edit-product', { product });
    } catch (error) {
        console.error("Error fetching product details:", error);
        res.status(500).send('Server error');
    }
});

// Handle Edit Product
router.post('/edit-product/:id', async (req, res) => {
    try {
        let productId = req.params.id;
        await productHelpers.updateProduct(productId, req.body);

        if (req.files && req.files.Image) {
            let image = req.files.Image;
            let uploadPath = path.join(__dirname, '../public/product-images', `${productId}.jpg`);

            image.mv(uploadPath, (err) => {
                if (err) {
                    console.error("Image upload failed:", err);
                    return res.status(500).send('Image upload failed');
                }
                res.redirect('/admin');
            });
        } else {
            res.redirect('/admin');
        }
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).send('Server error');
    }
});


const multer = require('multer');

// Set up storage for images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/product-images/')); // Ensure this path is correct
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});

const upload = multer({ storage: storage });

router.post('/add-product', upload.fields([
    { name: 'Image', maxCount: 1 }, // Main image
    { name: 'additionalImages', maxCount: 5 } // Additional images
]), async (req, res) => {
    try {
        let product = req.body;

        // Save the main image
        if (req.files['Image']) {
            product.Image = req.files['Image'][0].filename; // Save main image filename
        }

        // Save additional images
        if (req.files['additionalImages']) {
            product.additionalImages = req.files['additionalImages'][0].filename;// Save additional image filenames
        } else {
            product.additionalImages = []; // Empty array if no additional images
        }

        console.log("Product data before saving:", product);
        await productHelpers.addProduct(product);
        res.redirect('/add-product');
    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).send("Error adding product");
    }
});



module.exports = router;