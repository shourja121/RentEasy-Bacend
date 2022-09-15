const app = require('express').Router();
const { signup, signin } = require('../services/user.service');

app.post("/users/signup", signup);

app.post("/users/signin", signin);



module.exports = app;