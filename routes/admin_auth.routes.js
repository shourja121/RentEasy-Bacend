const routes=require('express').Router();
const {signup,signin}=require('../services/admin.service')


routes.post("/signup",signup);
routes.post("/signin",signin);

module.exports=routes;