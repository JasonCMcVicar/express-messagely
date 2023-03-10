"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");
const { NotFoundError } = require("../expressError");

/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(
      password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `INSERT INTO users (username,
                          password,
                          first_name,
                          last_name,
                          phone,
                          join_at,
                          last_login_at)
        VALUES
          ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
        RETURNING username, password, first_name, last_name, phone, join_at`,
      [username, hashedPassword, first_name, last_name, phone]);

    return result.rows[0];
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password
          FROM users
          WHERE username = $1`,
      [username]
    );
    const user = result.rows[0];

    if (user) {
      if (await bcrypt.compare(password, user.password) === true) {
        return true;
      }
    }

    return false;
  }

  /** Update last_login_at for user */

  // do a query for username
  // do sql insertion for last_login_at

  static async updateLoginTimestamp(username) {

    const result = await db.query(
      `UPDATE users
       SET last_login_at = current_timestamp
        WHERE username = $1
        RETURNING username, last_login_at`,
      [username]
    );
    const user = result.rows[0];

    if (!user) {
      throw new NotFoundError(`No such user: ${username}`);
    }

    return user;
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username, first_name, last_name
          FROM users`
    );

    return result.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {

    const result = await db.query(
      `SELECT username,
              first_name,
              last_name,
              phone,
              join_at,
              last_login_at
        FROM users
        WHERE username = $1`,
        [username]
    );

    const user = result.rows[0];

    if (!user) {
      throw new NotFoundError(`No such user: ${username}`);
    }

    return user;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const result = await db.query(
      `SELECT m.id,
              m.to_username,
              t.first_name,
              t.last_name,
              t.phone,
              m.body,
              m.sent_at,
              m.read_at
        FROM users AS u
              JOIN messages AS m ON u.username = m.from_username
              JOIN users AS t ON m.to_username = t.username
        WHERE u.username = $1`,
      [username]
    );

    let messages = result.rows;

    // This will never throw an error because an empty array is truthy.
    if (!messages) throw new NotFoundError(`No such message from user: ${username}`);

    for (let i = 0; i < messages.length; i++) {
      messages[i] = {
       id: messages[i].id,
       body: messages[i].body,
       sent_at: messages[i].sent_at,
       read_at: messages[i].read_at,
       to_user: {
        username: messages[i].to_username,
        first_name: messages[i].first_name,
        last_name: messages[i].last_name,
        phone: messages[i].phone
       },
      }
    }

    return messages;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const result = await db.query(
      `SELECT m.id,
              m.from_username,
              f.first_name,
              f.last_name,
              f.phone,
              m.body,
              m.sent_at,
              m.read_at
        FROM users AS u
              JOIN messages AS m ON u.username = m.to_username
              JOIN users AS f ON m.from_username = f.username
        WHERE u.username = $1`,
      [username]
    );
    let messages = result.rows;

    if (!messages) throw new NotFoundError(`No such message to user: ${username}`);

    for (let i = 0; i < messages.length; i++) {
      messages[i] = {
       id: messages[i].id,
       body: messages[i].body,
       sent_at: messages[i].sent_at,
       read_at: messages[i].read_at,
       from_user: {
        username: messages[i].from_username,
        first_name: messages[i].first_name,
        last_name: messages[i].last_name,
        phone: messages[i].phone
       },
      }
    }

    return messages;

  }



}


module.exports = User;
