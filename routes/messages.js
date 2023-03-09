"use strict";

const Router = require("express").Router;
const router = new Router();

const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth.js");
const User  = require("../models/user");
const Message = require("../models/message");
const { NotFoundError } = require("../expressError");


/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Makes sure that the currently-logged-in users is either the to or from user.
 *
 **/


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", ensureLoggedIn, async function (req, res, next) {
  const to_username = req.body.to_username;
  const body = req.body.body;

  try {
    const result = await User.get(to_username);
  } catch(err) {
    throw new NotFoundError(err);
  }

  try {
    const from_username = res.locals.user.username;
    let messageData = { from_username, to_username, body};
    const result = await Message.create(messageData);
    return res.json({message: result});
  } catch(err) {
    return next(err);
  }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 **/


module.exports = router;