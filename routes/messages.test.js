"use strict";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const { SECRET_KEY } = require("../config.js");
const Message = require("../models/message");

describe("Messages Routes Test", function () {

  let testUserToken;
  let testUserToken2;
  let u1;
  let u2;
  let m1;
  let m2;

  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    u1 = await User.register({
      username: "test1",
      password: "password",
      first_name: "Test1",
      last_name: "Testy1",
      phone: "+14155550000",
    });

    u2 = await User.register({
      username: "test2",
      password: "password",
      first_name: "Test2",
      last_name: "Testy2",
      phone: "+14155550001",
    });

    m1 = await Message.create({
      from_username: "test2",
      to_username: "test1",
      body: "hi",
    });

    // m2 = await Message.create({
    //   from_username: "test1",
    //   to_username: "test2",
    //   body: "hello",
    // });


    const testUser1 = { username: "test1" };
    const testUser2 = { username: "test2" };
    testUserToken = jwt.sign(testUser1, SECRET_KEY);
    testUserToken2 = jwt.sign(testUser2, SECRET_KEY);

  });

  describe("GET /messages/:id", function () {
    test("to_user can get detail of a message", async function () {
      m1 = await Message.get(m1.id);
      let response = await request(app)
        .get(`/messages/${m1.id}`)
        .query({ _token: testUserToken });

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        message:
          {
            id: m1.id,
            body: m1.body,
            sent_at: expect.any(String),
            read_at: m1.read_at,
            from_user: {
                        username: m1.from_user.username,
                        first_name: m1.from_user.first_name,
                        last_name: m1.from_user.last_name,
                        phone: m1.from_user.phone,
                        },
            to_user: {
                      username: m1.to_user.username,
                      first_name: m1.to_user.first_name,
                      last_name: m1.to_user.last_name,
                      phone: m1.to_user.phone,
                     },
          }
      });
    });
    test("error with invalid id", async function () {
      let response = await request (app)
        .get("/messages/75")
        .query({ _token: testUserToken });

      expect(response.statusCode).toEqual(404);
    });
    test("error without a token/logged-in user", async function () {
      let response = await request (app)
        .get(`/messages/${m1.id}`)
        .query();

      expect(response.statusCode).toEqual(401);
    });
    test("error without a valid token", async function () {
      let response = await request (app)
        .get(`/messages/${m1.id}`)
        .query({ _token: "invalid"});

      expect(response.statusCode).toEqual(401);
    });
    test("from_user can get detail of a message", async function () {
      m1 = await Message.get(m1.id);
      let response = await request(app)
        .get(`/messages/${m1.id}`)
        .query({ _token: testUserToken2 });

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        message:
          {
            id: m1.id,
            body: m1.body,
            sent_at: expect.any(String),
            read_at: m1.read_at,
            from_user: {
                        username: m1.from_user.username,
                        first_name: m1.from_user.first_name,
                        last_name: m1.from_user.last_name,
                        phone: m1.from_user.phone,
                        },
            to_user: {
                      username: m1.to_user.username,
                      first_name: m1.to_user.first_name,
                      last_name: m1.to_user.last_name,
                      phone: m1.to_user.phone,
                     },
          }
      });
    });
  });

  describe("POST /messages/", function () {
    test("can send a new message to an existing user", async function () {
      let response = await request(app)
        .post("/messages/")
        .query({ _token: testUserToken })
        .send({
          to_username: u2.username,
          body: "hello"
        });

      expect(response.statusCode).toEqual(201);
      expect(response.body).toEqual({
        message: {
          id: expect.any(Number),
          from_username: "test1",
          to_username: "test2",
          body: "hello",
          sent_at: expect.any(String)
        }
      });
    });

    test("will throw an error if to_username doesn't exist", async function () {
      let response = await request(app)
        .post("/messages/")
        .query({ _token: testUserToken })
        .send({
          to_username: "invalid",
          body: "hello"
        });

      expect(response.statusCode).toEqual(404);
    });

    test("will throw an error if invalid token", async function () {
      let response = await request(app)
        .post("/messages/")
        .query({ _token: "invalid" })
        .send({
          to_username: u2.username,
          body: "hello"
        });

      expect(response.statusCode).toEqual(401);
    });

    test("will throw an error without a token", async function () {
      let response = await request(app)
        .post("/messages/")
        .query()
        .send({
          to_username: u2.username,
          body: "hello"
        });

      expect(response.statusCode).toEqual(401);
    });
  });
});

afterAll(async function () {
  await db.end();
});
