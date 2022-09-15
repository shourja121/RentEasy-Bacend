const app = require('express').Router();
const { addProducts, getProducts, getRentedProducts, getProductsById, modifyProducts } = require('../services/admin.service');

app.post("/addproducts", addProducts);
app.get("/getProducts", getProducts);
app.get("/getRentedProducts", getRentedProducts);
app.get("/:id", getProductsById);
app.put("/modifyProducts", modifyProducts);

module.exports = app;
