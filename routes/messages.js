"use strict";

const Router = require("express").Router;
const router = new Router();

const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth.js");
const User  = require("../models/user");
const Message = require("../models/message");
const { NotFoundError, UnauthorizedError } = require("../expressError");
const db = require("../db.js");


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
router.get("/:id", ensureLoggedIn, async function (req, res, next) {
  const { id } = req.params;

  const result = await Message.get(id);

  if (res.locals.user.username === result.to_user.username ||
     res.locals.user.username === result.from_user.username) {
      return res.json({message: result})
  } else {
      throw new UnauthorizedError();
  }

});


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
    return res.status(201).json({message: result});
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
// ensureLoggedIn middleware
// get message by ID using req.params.id
// check that message result .toUser equals the logged in username in token
// use markRead to update and obtain message data
// return successful result OR throw error
router.post("/:id/read", ensureLoggedIn, async function (req, res, next) {
  try {
    const { id } = req.params;
    const messageResult = await Message.get(id);

    if (res.locals.user.username !== messageResult.to_user.username) {
      throw new UnauthorizedError();
    } else {
      const result = await Message.markRead(id);
      return res.json({message: result});
    }
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
