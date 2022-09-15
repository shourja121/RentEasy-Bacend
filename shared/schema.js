const joi = require('joi');

module.exports = {
    user_signup: joi.object({
        username: joi.string().min(3).required(),
        email: joi.string().email().required(),
        pass: joi.string().min(5).required(),
        cpass: joi.ref('pass')
    }),
    user_signin: joi.object({
        email: joi.string().email().required(),
        pass: joi.string().min(5).required(),
    }),

    admin_addProducts: joi.object({
        name: joi.string().min(5).max(500).required(),
        quantity: joi.number().min(1).required(),
        price: joi.number().min(100).required(),
        image_url: joi.string().required(),
        category: joi.string().min(3).valid('mobile', 'clothes', 'camera').required(),
        isAvailable: joi.boolean().required(),
    }),
    admin_modifyProducts: joi.object({
        prod_id: joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
        name: joi.string().min(5).max(500).required(),
        quantity: joi.number().min(1).required(),
        price: joi.number().min(100).required(),
        image_url: joi.string().required(),
        quantityBought: joi.number().required(),
        category: joi.string().min(3).valid('mobile', 'clothes', 'camera').required(),
        isAvailable: joi.boolean().required(),
    }),
    cart: joi.object({
        prod_id: joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
        name: joi.string().required(),
        image_url: joi.string().required(),
        noOfDays: joi.number().required(),
        startDate: joi.date().required(),
        endDate: joi.date().required(),
        quantity: joi.number().min(1).required(),
        price: joi.number().min(1).required(),
        quantity_available: joi.number().min(1).required(),
        perUnit_price: joi.number().min(1).required()
    }),
    deletFromCart: joi.object({
        prod_id: joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    }),
    async isError(schema, data) {
        try {
            // console.log(schema.validateAsync(data));
            await schema.validateAsync(data);
            return false;
        }
        catch ({ details: [error] }) {
            // console.log(err);
            console.log("Error from schema.js", error);
            return error.message;
        }
    }
}