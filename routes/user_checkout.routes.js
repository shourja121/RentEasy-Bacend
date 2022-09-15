const app = require('express').Router();
const { addToCart, getProductsFromCart, deleteFromCart, getProduct, checkout, editFromCart, getKey } = require('../services/user.service')


app.put("/cart", addToCart);
app.put("/editcart", editFromCart);
app.get("/rkey", getKey)
app.get("/getProductsFromCart", getProductsFromCart);
app.get("/:id", getProduct);
app.delete("/deleteFromCart", deleteFromCart);
app.post("/checkout", checkout);



module.exports = app;