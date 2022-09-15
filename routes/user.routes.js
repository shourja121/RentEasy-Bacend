const app = require('express').Router();
const { getAllProducts, getProductsByCategory, getProductsOnSearch, verifyPayment, getProductAvailability } = require('../services/user.service');

app.get("/getAllProducts", getAllProducts);
app.get("/getProductsByCategory", getProductsByCategory);
app.get("/getProductsOnSearch/:search", getProductsOnSearch);
app.get("/checkisavailable", getProductAvailability);
app.post("/verify", verifyPayment)


module.exports = app;