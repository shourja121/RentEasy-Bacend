const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mongo = require('../shared/mongo');
const dotenv = require('dotenv');
const { user_signup, user_signin, admin_addProducts, admin_modifyProducts, isError } = require('../shared/schema');


dotenv.config();


module.exports = {
    async signup(req, res) {
        try {
            const message = await isError(user_signup, req.body);
            if (message) return res.status(400).json({ message: message });
            const user = await mongo.admins.findOne({ email: req.body.email });
            // console.log(user);
            if (user) return res.status(401).json({ message: "Email already exists" });
            delete req.body.cpass;
            req.body.pass = await bcrypt.hash(req.body.pass, await bcrypt.genSalt(6));
            await mongo.admins.insertOne({ ...req.body, createdAt: new Date().toLocaleString(undefined, { timeZone: 'Asia/Kolkata' }) })
            res.status(200).json({ message: "User created successfully" });
        }
        catch (e) {
            console.log(e);
            res.status(500).json({ message: "Internal error" });
        }
    },
    async signin(req, res) {
        try {
            const message = await isError(user_signin, req.body);
            if (message) return res.status(400).json({ message: message });
            const user = await mongo.admins.findOne({ email: req.body.email });
            // console.log(user);
            if (!user) return res.status(400).json({ message: 'Invalid email or password' });
            const isValid = await bcrypt.compare(req.body.pass, user.pass);
            if (!isValid) return res.status(400).json({ message: 'Invalid email or password' });
            const auth_token = jwt.sign({ _id: user._id }, process.env.KEY, {
                expiresIn: "6h",
            });
            // console.log("Token for user:", auth_token);
            return res.status(200).json({ message: "Success", token: auth_token });
        }
        catch (e) {
            console.log("from admin.auth", e);
            res.status(500).json({ message: "Internal error" });
        }
    },
    async addProducts(req, res) {
        try {
            // console.log("123",req.id);
            if (!req.id) { return res.status(401).json({ message: "Unauthorized access" }); }
            const id = req.id;
            const user = await mongo.admins.findOne({ _id: mongo.ObjectId(id) });
            if (!user) return res.status(403).json({ message: "Unauthorized access" })
            const message = await isError(admin_addProducts, req.body);
            if (message) return res.status(400).json({ message: message });
            // req.body.name=req.body.name.toLowerCase();
            req.body.quantityBought = 0;

            await mongo.products.insertOne({ ...req.body, owner: id, createdAt: new Date().toLocaleString(undefined, { timeZone: 'Asia/Kolkata' }) });
            res.status(200).json({ message: `Your product ${req.body.name} is successfully added` });
        }
        catch (e) {
            console.log("from admin.auth", e);
            res.status(500).json({ message: "Internal error" });
        }
    },
    async getProducts(req, res) {
        try {
            let id = req.id;
            console.log(id);
            const project = { "name": 1, "price": 1, quantityBought: 1, image_url: 1, "category": 1, "quantity": 1 };
            const data = await mongo.products.find({ owner: id }).project(project).toArray();
            res.status(200).json(data);
        }
        catch (e) {
            console.log("from getProducts admin", e);
            res.status(500).json({ message: "Internal error" });
        }
    },
    async getRentedProducts(req, res) {
        try {
            console.log("123", req.id)
            const project = { "name": 1, "price": 1, quantityBought: 1, image_url: 1, "category": 1, "quantity": 1 };
            if (req.query.isRented === "all") {
                console.log(req.query.isRented);
                const data = await mongo.products.find({ owner: req.id }).project(project).toArray();
                return res.status(200).json(data);
            }
            req.query.isRented = req.query.isRented === "true" ? true : false;
            let data;
            console.log(123);
            if (req.query.isRented)
                data = await mongo.products.find({ owner: req.id, quantityBought: { $gt: 0 } }).project(project).toArray();
            else if (!req.query.isRented)
                data = await mongo.products.find({ owner: req.id, quantityBought: 0 }).project(project).toArray();
            return res.status(200).json(data);
        }
        catch (e) {
            console.log("from getRentedProducts", e);
            res.status(500).json({ message: "Internal error" });
        }
    },
    async getProductsById(req, res) {
        try {
            const prod = await mongo.products.findOne({ _id: mongo.ObjectId(req.params.id) }, { projection: { createdAt: 0, owner: 0, rentedBy: 0, } });
            if (!prod)
                return res.status(404).json({ message: "Product not found" });
            return res.status(200).json(prod);
        }
        catch (e) {
            console.log("from getProductsByid", e);
            res.status(500).json({ message: "Internal error" });
        }
    },
    async modifyProducts(req, res) {
        try {
            if (!req.id) { return res.status(401).json({ message: "Unauthorized access" }); }
            const id = req.id;
            const user = await mongo.admins.findOne({ _id: mongo.ObjectId(id) });
            if (!user) return res.status(403).json({ message: "Unauthorized access" })
            const message = await isError(admin_modifyProducts, req.body);
            if (message) return res.status(400).json({ message: message });
            if (req.body.quantityBought >= req.body.quantity) {
                req.body.isAvailable = false
            }
            const uprod = await mongo.products.updateOne({ _id: mongo.ObjectId(req.body.prod_id) }, { $set: { name: req.body.name, price: req.body.price, quantity: req.body.quantity, image_url: req.body.image_url, category: req.body.category, quantityBought: req.body.quantityBought, isAvailable: req.body.isAvailable } })
            res.status(200).json({ message: "success" });
        }
        catch (e) {
            console.log("From modifyProduct", e);
            res.status(404).json({ message: "Internal error" });
        }
    }
}

