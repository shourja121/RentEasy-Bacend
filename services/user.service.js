const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const mongo = require('../shared/mongo');
const { user_signup, user_signin, cart, test, isError } = require('../shared/schema')
const instance = require('../shared/razor');
var crypto = require("crypto");
dotenv.config();


module.exports = {
    async signup(req, res) {
        try {
            const message = await isError(user_signup, req.body);
            if (message) return res.status(400).json({ message: message });
            const user = await mongo.users.findOne({ email: req.body.email });
            // console.log(user);
            if (user) return res.status(401).json({ message: "Email already exists" });
            delete req.body.cpass;
            req.body.pass = await bcrypt.hash(req.body.pass, await bcrypt.genSalt(6));
            req.body.cart = [];
            req.body.cart_total = 0;
            req.body.rentedProducts = [];
            await mongo.users.insertOne({ ...req.body, createdAt: new Date().toLocaleString(undefined, { timeZone: 'Asia/Kolkata' }) })
            res.status(200).json({ message: "User created successfully" });
        }
        catch (e) {
            console.log("From user_auth", e);
            res.status(500).json({ message: "Internal error" });
        }
    },
    async signin(req, res) {
        try {
            const message = await isError(user_signin, req.body);
            if (message) return res.status(400).json({ message: message });
            const user = await mongo.users.findOne({ email: req.body.email });
            if (!user) return res.status(401).json({ message: "Invalid email or password" });
            const isValid = await bcrypt.compare(req.body.pass, user.pass);
            if (!isValid) return res.status(401).json({ message: "Invalid email or password" });
            const auth_token = jwt.sign({ _id: user._id }, process.env.KEY, {
                expiresIn: "6h",
            });
            console.log("Token for user:", auth_token);
            res.status(200).json({ message: "Success", token: auth_token });
        }
        catch (e) {
            console.log("From user_auth signin", e);
            res.status(500).json({ message: "Internal error" });
        }
    },
    async getAllProducts(req, res) {
        try {
            const project = { "name": 1, "price": 1, "isAvailable": 1, "category": 1, "image_url": 1 };
            const products = await mongo.products.find().project(project).toArray();
            res.status(200).json(products);
        }
        catch (e) {
            res.status(500).json({ message: "Internal error" });
            console.log("from getAllProducts", e);
        }
    },
    async getProductsOnSearch(req, res) {
        try {
            let q = req.params.search;
            const project = { "name": 1, "price": 1, "isAvailable": 1, "category": 1, "image_url": 1 };
            const data = await mongo.products.find({ name: { $regex: `${req.params.search}`, $options: "i" } }).project(project).toArray();
            return res.status(200).json(data);
        }
        catch (e) {
            res.status(500).json({ message: "Internal error" });
            console.log("from getAllProducts", e);
        }
    },
    async getProductAvailability(req, res) {
        try {
            const project = { "name": 1, "price": 1, "isAvailable": 1, "category": 1, "image_url": 1 };
            if (req.query.availability === "all") {
                const data = await mongo.products.find().project(project).toArray();
                console.log(data);
                return res.status(200).json(data);
            }
            req.query.availability = req.query.availability === "true" ? true : false;
            console.log(Boolean(req.query.availability))
            const data = await mongo.products.find({ isAvailable: req.query.availability }).project(project).toArray();
            console.log(data);
            return res.status(200).json(data);
        }
        catch (e) {
            console.log("from getProductAvailability", e);
            res.status(500).json({ message: "Internal error" });
        }
    },
    async getProductsByCategory(req, res) {
        try {
            let products;
            const project = { "name": 1, "price": 1, "isAvailable": 1, "category": 1, "image_url": 1 };
            if (req.query.category === "all") {
                products = await mongo.products.find().project(project).toArray();
            }
            else
                products = await mongo.products.find({ category: { "$in": req.query.category.split(",") } }).project(project).toArray();
            res.status(200).json(products);
        }
        catch (e) {
            res.status(500).json({ message: "Internal error" });
            console.log("from getAllProducts", e);
        }
        // console.log(req.query);
        // res.json({message:req.query.category})
    },
    async getProduct(req, res) {
        try {
            const id = req.params.id;
            const prod = await mongo.products.findOne({ _id: mongo.ObjectId(id) }, { projection: { "name": 1, "price": 1, category: 1, quantity: 1, image_url: 1 } })
            return res.status(200).json(prod);
        }
        catch (e) {
            res.status(500).json({ message: "Internal error" });
            console.log("from getProduct", e);
        }
    },
    async addToCart(req, res) {
        try {
            const id = req.id;
            // console.log("123123123", mongo.ObjectId(id));
            const message = await isError(cart, req.body);
            if (message) return res.status(400).json(message);
            console.log(req.body.startDate);
            // if (!sdateValid(req.body.startDate)) return res.status(401).json({ message: "Invalid start date." });
            // if (!edateValid(req.body.endDate)) return res.status(401).json({ message: "Invalid end date" })
            const isProd = await mongo.products.findOne({ _id: mongo.ObjectId(req.body.prod_id) });
            if (!isProd) return res.status(404).json({ message: 'Product not found' });
            const user = await mongo.users.findOne({ _id: mongo.ObjectId(id) });
            let arr = [];
            arr = [...user.cart];
            console.log("before update", arr);
            if (arr.length !== 0) {
                const ind = arr.findIndex((obj) => obj.prod_id === req.body.prod_id);
                console.log(ind)
                if (ind !== -1) {
                    return res.status(401).json({ message: "Alreading exisiting in cart,please go to your cart for making changes" })
                }
                else {
                    arr.push(req.body);
                }
            }
            else
                arr.push(req.body);
            user.cart_total = Math.abs(user.cart_total + req.body.price);
            console.log("After update", arr);
            await mongo.users.updateOne({ _id: mongo.ObjectId(id) }, { $set: { cart: arr, cart_total: user.cart_total } })
            res.status(200).json({ "message": "Added to cart successfully" });
        }
        catch (e) {
            res.status(500).json({ message: "Internal error" });
            console.log("from cart", e);
        }
    },
    async editFromCart(req, res) {
        try {
            const id = req.id;
            // console.log("123123123", mongo.ObjectId(id));
            const message = await isError(cart, req.body);
            if (message) return res.status(400).json(message);
            const isProd = await mongo.products.findOne({ _id: mongo.ObjectId(req.body.prod_id) });
            if (!isProd) return res.status(404).json({ message: 'Product not found' });
            const user = await mongo.users.findOne({ _id: mongo.ObjectId(id) });
            const arr = [...user.cart];
            const ind = arr.findIndex((prod) => prod.prod_id === req.body.prod_id);
            if (ind === -1)
                return res.status(404).json({ message: 'Product not found' });
            arr[ind] = req.body;
            let total = 0;
            console.log(arr);
            for (let i in arr) {
                total += arr[i].price;
            }
            console.log(total);
            // console.log(user.cart_total);
            await mongo.users.updateOne({ _id: mongo.ObjectId(id) }, { $set: { cart: arr, cart_total: total } })
            res.status(200).json({ cart: arr, cart_total: total })
        }
        catch (e) {
            res.status(500).json({ message: "Internal error" });
            console.log("from editcart", e);
        }
    },
    async deleteFromCart(req, res) {
        try {
            const id = req.id;
            const user = await mongo.users.findOne({ _id: mongo.ObjectId(id) }, { projection: { cart: 1, cart_total: 1 } });
            console.log(user);
            const arr = [...user.cart];
            console.log("length:", arr.length)
            const ind = arr.findIndex((prod) => prod.prod_id === req.body.prod_id);
            console.log(ind)
            if (ind === -1)
                return res.status(404).json({ message: "Product not found" })
            arr.splice(ind, 1);
            console.log("After deletion", arr);
            let total = 0;
            for (let i in arr) {
                total += arr[i].price;
            }
            await mongo.users.updateOne({ _id: mongo.ObjectId(id) }, { $set: { cart: arr, cart_total: total } })
            res.status(200).json({ cart: arr, cart_total: total });
        }
        catch (e) {
            console.log("from delete from cart", e);
            res.status(500).json({ message: e.message });
        }
    },
    async getProductsFromCart(req, res) {
        const id = req.id;
        try {
            const arr_prod = [];
            const project = { cart: 1 }
            const { cart, cart_total } = await mongo.users.findOne({ _id: mongo.ObjectId(id) }, { projection: { cart: 1, cart_total: 1, _id: 0 } });
            for (let i in cart) {
                const { quantity, price } = await mongo.products.findOne({ _id: mongo.ObjectId(cart[i].prod_id) }, { projection: { quantity: 1, price: 1 } });
                if (cart[i].quantity_available !== quantity) {
                    console.log("From quan")
                    console.log(cart[i].quantity_available, quantity);
                    console.log(cart[i].quantity_available !== quantity);
                    cart[i].quantity_available = quantity;
                }
                if (cart[i].perUnit_price !== price) {
                    console.log("from price")
                    cart[i].perUnit_price = price;
                    if (cart[i].quantity_available >= cart[i].quantity)
                        cart[i].price = cart[i].noOfDays * cart[i].quantity * cart[i].perUnit_price;
                }
            }
            return res.status(200).json({ cart: cart, cart_total: cart_total });
        }
        catch (e) {
            res.status(500).json({ message: "Internal error" });
            console.log("from get from cart", e);
        }
    },
    async test(req, res) {
        try {
            const message = await isError(test, req.body);
            if (message) return res.status(400).json({ message: message })
            return res.status(200).json(req.body);
        }
        catch (e) {
            console.log(e);
            res.status(500).json({ message: e.message })
        }
    },
    async getKey(req, res) {
        res.status(200).json({ key: process.env.RAZORPAY_API_KEY })
    },
    async checkout(req, res) {
        try {
            const options = {
                amount: Number(req.body.total_amount) * 100,
                currency: "INR",
                // key:123
            };
            const order = await instance.orders.create(options);
            res.status(200).json(order);
        }
        catch (e) {
            console.log("From checkout service", e);
            res.status(500).json({ message: e.error.description });

        }
    },
    async verifyPayment(req, res) {
        try {
            console.log(req.body, req.query);
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
            let body = razorpay_order_id + "|" + razorpay_payment_id;
            var expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_API_SECRET_KEY)
                .update(body.toString())
                .digest('hex');
            console.log("sig received ", razorpay_signature);
            console.log("sig generated ", expectedSignature);
            const isTrue = expectedSignature === razorpay_signature;
            if (!isTrue)
                return res.status(500).json({ message: 'failure' })
            let { _id } = jwt.verify(req.query.token, process.env.KEY);
            const user = await mongo.users.findOne({ _id: mongo.ObjectId(_id) })
            console.log("123 done from user");
            console.log(user);
            user.rentedProducts = [...user.cart];
            user.cart.splice(0, user.cart.length);
            user.cart_total = 0;
            await mongo.users.updateOne({ _id: mongo.ObjectId(_id) }, { $set: { cart: user.cart, cart_total: user.cart_total, rentedProducts: user.rentedProducts } });
            for (let i in user.rentedProducts) {
                let arr = []
                const prod = await mongo.products.findOne({ _id: mongo.ObjectId(user.rentedProducts[i].prod_id) });
                if (!prod.rentedBy) {
                    prod.quantity -= user.rentedProducts[i].quantity;
                    prod.quantityBought = user.rentedProducts[i].quantity;
                    if (prod.quantity < 1)
                        prod.isAvailable = false;
                    arr.push(_id);
                }
                else {
                    arr = [...prod.rentedBy];
                    prod.quantity -= user.rentedProducts[i].quantity;
                    prod.quantityBought = user.rentedProducts[i].quantity;
                    if (prod.quantity < 1)
                        prod.isAvailable = false;
                    arr.push(_id);
                }
                console.log(prod);
                await mongo.products.updateOne({ _id: mongo.ObjectId(user.rentedProducts[i].prod_id) }, { $set: { rentedBy: arr, quantity: prod.quantity, quantityBought: prod.quantityBought, isAvailable: prod.isAvailable } })
            }
            res.redirect(`/redirect?order_id=${razorpay_order_id}`)

        }
        catch (e) {
            console.log("From payment", e);
            res.status(500).json({ message: 'internal error' })
        }
    }
}
