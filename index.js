const express = require('express');
const app = express();
const dotenv = require('dotenv');
const mongo = require('./shared/mongo');
const admin = require('./routes/admin_auth.routes');
const non_admin = require('./routes/user_auth.routes');
const admin_services = require('./routes/admin.routes');
const non_admin_services = require('./routes/user.routes');
const user_checkout = require('./routes/user_checkout.routes');

const { maintain, check } = require('./shared/middleware');
const cors = require('cors');
dotenv.config();

(async () => {
    try {
        app.listen(process.env.PORT, () => console.log("server running at:", process.env.PORT));
        await mongo.connect();
        app.use(cors({
            origin: '*',
            credentials:false
        }))
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }))
        app.use(maintain);
        app.get("/testing123", (req, res) => {
            res.json({ message: 123 });
        })
        app.use("/", non_admin);
        app.use("/admin", admin);
        app.use("/", non_admin_services);
        app.use(check);
        app.use("/admin", admin_services);
        app.use("/", user_checkout);

    }
    catch (e) {
        console.log("Error in index.js file", e);
    }
})();

