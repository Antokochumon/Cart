var db = require('../config/connection');
var collection = require('../config/collection');
const { ObjectId } = require('mongodb');

module.exports = {
    // Add a new product
    addProduct: (product) => {
        return new Promise(async (resolve, reject) => {
            try {
                const productData = {
                    Name: product.Name,
                    Category: product.Category,
                    Price: product.Price,
                    Description: product.Description,
                    Image: product.Image , // Save main image filename
                    additionalImages: product.additionalImages || [] // Save additional image filenames
                };
    
                console.log("Product data being inserted:", productData); // Log the product data
    
                let data = await db.get().collection(collection.PRODUCT_COLLECTION).insertOne(productData);
                console.log("Product inserted successfully. Inserted ID:", data.insertedId); // Log the inserted ID
                resolve(data.insertedId);
            } catch (err) {
                console.error("Error inserting product:", err); // Log any errors
                reject(err);
            }
        });
    },
    
    
    

    // Get all products
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray();
                resolve(products);
            } catch (err) {
                reject(err);
            }
        });
    },

    // Delete a product
    deleteProduct: (productId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let response = await db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: new ObjectId(productId) });
                console.log("Delete response:", response);
                resolve(response);
            } catch (err) {
                console.error("Delete error:", err);
                reject(err);
            }
        });
    },

    // Get product details by ID
    getProductDetails: (productId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: new ObjectId(productId) });
                resolve(product);
            } catch (err) {
                reject(err);
            }
        });
    },

    // Update a product
    updateProduct: (proId, proDetails) => {
        return new Promise(async (resolve, reject) => {
            try {
                let response = await db.get().collection(collection.PRODUCT_COLLECTION)
                    .updateOne({ _id: new ObjectId(proId) }, {
                        $set: {
                            Name: proDetails.Name,
                            Description: proDetails.Description,
                            Price: proDetails.Price,
                            Category: proDetails.Category,
                        }
                    });
                resolve(response);
            } catch (err) {
                reject(err);
            }
        });
    }
};