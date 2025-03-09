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

        // Ensure that additional images are handled properly
        let additionalImages = req.files.additionalImages ? Array.isArray(req.files.additionalImages) ? req.files.additionalImages : [req.files.additionalImages] : [];

        // Assign filenames to productData
        productData.Image = `${Date.now()}_${image.name}`; // Main image filename
        productData.additionalImages = additionalImages.map((img, index) => `${Date.now()}_${index}_${img.name}`); // Additional image filenames

        // Insert the product and get the product ID
        let productId = await productHelpers.addProduct(productData);

        // Upload the main image
        let uploadPath = path.join(__dirname, '../public/product-images', productData.Image);
        
        if (!fs.existsSync(path.dirname(uploadPath))) {
            fs.mkdirSync(path.dirname(uploadPath), { recursive: true });
        }

        // Move the main image
        image.mv(uploadPath, (err) => {
            if (err) {
                console.error("Image upload failed:", err);
                return res.status(500).send('Image upload failed');
            }

            // Now handle the additional images
            additionalImages.forEach((img, index) => {
                let additionalImagePath = path.join(__dirname, '../public/product-images', productData.additionalImages[index]);
                img.mv(additionalImagePath, (err) => {
                    if (err) {
                        console.error("Additional image upload failed:", err);
                    }
                });
            });

            // After uploading all images, redirect to the admin page
            res.redirect('/admin/add-product');
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
// Handle Edit Product
router.post('/edit-product/:id', async (req, res) => {
    try {
        let productId = req.params.id;
        let productData = req.body;

        // Fetch the existing product to get old image filenames
        let existingProduct = await productHelpers.getProductDetails(productId);
        if (!existingProduct) {
            return res.status(404).send('Product not found');
        }

        // Handle main image update
        if (req.files && req.files.Image) {
            let image = req.files.Image;
            let newImageName = `${Date.now()}_${image.name}`; // Generate a new unique filename
            let uploadPath = path.join(__dirname, '../public/product-images', newImageName);

            // Move the new image to the upload directory
            image.mv(uploadPath, async (err) => {
                if (err) {
                    console.error("Image upload failed:", err);
                    return res.status(500).send('Image upload failed');
                }

                // Delete the old main image
                if (existingProduct.Image) {
                    let oldImagePath = path.join(__dirname, '../public/product-images', existingProduct.Image);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                }

                // Update the product data with the new image filename
                productData.Image = newImageName;

                // Handle additional images update
                if (req.files.additionalImages) {
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
                    productData.additionalImages = req.files.additionalImages.map((img, index) => `${Date.now()}_${index}_${img.name}`);

                    // Move the new additional images to the upload directory
                    req.files.additionalImages.forEach((img, index) => {
                        let additionalImagePath = path.join(__dirname, '../public/product-images', productData.additionalImages[index]);
                        img.mv(additionalImagePath, (err) => {
                            if (err) {
                                console.error("Additional image upload failed:", err);
                            }
                        });
                    });
                } else {
                    // Keep the existing additional images if no new ones are uploaded
                    productData.additionalImages = existingProduct.additionalImages;
                }

                // Update the product in the database
                await productHelpers.updateProduct(productId, productData);
                res.redirect('/admin');
            });
        } else {
            // If no new main image is uploaded, keep the existing main image
            productData.Image = existingProduct.Image;

            // Handle additional images update
            if (req.files && req.files.additionalImages) {
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
                productData.additionalImages = req.files.additionalImages.map((img, index) => `${Date.now()}_${index}_${img.name}`);

                // Move the new additional images to the upload directory
                req.files.additionalImages.forEach((img, index) => {
                    let additionalImagePath = path.join(__dirname, '../public/product-images', productData.additionalImages[index]);
                    img.mv(additionalImagePath, (err) => {
                        if (err) {
                            console.error("Additional image upload failed:", err);
                        }
                    });
                });
            } else {
                // Keep the existing additional images if no new ones are uploaded
                productData.additionalImages = existingProduct.additionalImages;
            }

            // Update the product in the database
            await productHelpers.updateProduct(productId, productData);
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
            product.additionalImages = req.files['additionalImages'].map(file => file.filename); // Save additional image filenames
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
