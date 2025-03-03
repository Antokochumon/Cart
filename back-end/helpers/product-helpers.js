var db = require('../config/connection');
var collection = require('../config/collection');
const { ObjectId } = require('mongodb');

module.exports = {
    // Add a new product
    addProduct: (product, callback) => {
        console.log(product);

        const productData = {
            Name: product.Name,
            Category: product.Category,
            Price: product.Price,
            Description: product.Description,
            Image: product.Image, // Main image path
            additionalImages: product.additionalImages || [], // Additional image paths
        };

        db.get().collection('product').insertOne(productData).then((data) => {
            callback(data.insertedId);
        });
    },

    // Get all products
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray();
            resolve(products);
        });
    },

    // Delete a product
    deleteProduct: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: new ObjectId(productId) })
                .then((response) => {
                    console.log("Delete response:", response);
                    resolve(response); // Resolve with response
                })
                .catch((err) => {
                    console.error("Delete error:", err);
                    reject(err); // Reject with error
                });
        });
    },

    // Get product details by ID
    getProductDetails: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: new ObjectId(productId) }).then((product) => {
                resolve(product);
            });
        });
    },

    // Update a product
    updateProduct: (proId, proDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION)
                .updateOne({ _id: new ObjectId(proId) }, {
                    $set: {
                        Name: proDetails.Name,
                        Description: proDetails.Description,
                        Price: proDetails.Price,
                        Category: proDetails.Category,
                    }
                }).then((response) => {
                    resolve();
                });
        });
    }
};