"use strict";

const Router = require("express").Router;
const router = new Router();
const jwt = require("jsonwebtoken");

const { SECRET_KEY } = require("../config");
const User  = require("../models/user");
const { UnauthorizedError, BadRequestError } = require("../expressError");

/** POST /login: {username, password} => {token} */
router.post("/login", async function (req, res, next) {
    const { username, password } = req.body;
    const result = await User.authenticate(username, password);

    if (result) {
      User.updateLoginTimestamp(username);
      const token = jwt.sign({ username },SECRET_KEY);

      return res.json({ token });
    }
    throw new UnauthorizedError("Invalid username/password");
});


/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */
router.post("/register", async function (req, res, next) {

  // call register method to place username, psw, fname, lname, ph in db
  // get back a result, use that username to create token

  const userdata = req.body;
  const result = await User.register(userdata);

  if (result) {
    let payload = {username: result.username}
    const token = jwt.sign(payload, SECRET_KEY);
    return res.json({ token });
  }
  throw new BadRequestError("Invalid attempt at account creation");

});

module.exports = router;
