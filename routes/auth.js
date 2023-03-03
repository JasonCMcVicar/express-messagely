"use strict";

const Router = require("express").Router;
const router = new Router();
const jwt = require("jsonwebtoken");

const { SECRET_KEY } = require("../config");
const User  = require("../models/user");
const { UnauthorizedError } = require("../expressError");

/** POST /login: {username, password} => {token} */
router.post("/login", async function (req, res, next) {
    const { username, password } = req.body;
    const result = await User.authenticate(username, password);
    console.log("result=", result);

    if (result) {
        const token = jwt.sign(username, SECRET_KEY);
        console.log("token.iat=", token.iat);

        const tokenRes = jwt.verify(token, SECRET_KEY);

        console.log(tokenRes);
        
        return res.json({ token });
    }
    throw new UnauthorizedError("Invalid username/password");
});

// receive a request from a user
    // params: username, password
// look at request object
// access request parameters
// pass parameters to User model with authenticate method
// if fails, throw an error
// if successful authentication (receives true), create a token using JWT
// return response object as a json token


/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */

module.exports = router;