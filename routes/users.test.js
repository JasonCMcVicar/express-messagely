"use strict";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const { SECRET_KEY } = require("../config.js");
const Message = require("../models/message");

describe("Users Routes Test", function () {

  let testUserToken;
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

    m2 = await Message.create({
      from_username: "test1",
      to_username: "test2",
      body: "hello",
    });


    const testUser1 = { username: "test1" };
    testUserToken = jwt.sign(testUser1, SECRET_KEY);

  });

  describe("GET /users/", function () {
    test("can get list of all users", async function () {
      let response = await request(app)
        .get("/users/")
        .query({ _token: testUserToken });

      expect(response.body).toEqual({
        users:
          [{
            username: "test1",
            first_name: "Test1",
            last_name: "Testy1",
          },
          {
            username: "test2",
            first_name: "Test2",
            last_name: "Testy2",
          }]
      });
    });
    test("test will error with no token", async function () {
      let response = await request (app)
        .get("/users/")
        .query();

      expect(response.statusCode).toEqual(401);
    });
    test("test will error with a bad token", async function () {
      let response = await request (app)
        .get("/users/")
        .query({ _token: "crash"});

      expect(response.statusCode).toEqual(401);
    });
  });

  describe("GET /users/:username", function () {
    test("can get a user's details with correct token", async function () {
      let response = await request(app)
        .get(`/users/${u1.username}`)
        .query({ _token: testUserToken });

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        user: {
          username: u1.username,
          first_name: u1.first_name,
          last_name: u1.last_name,
          phone: u1.phone,
          join_at: expect.any(String),
          last_login_at: expect.any(String),
        }
      });
    });

    test("throws error with incorrect token", async function () {
      let response = await request(app)
        .get(`/users/${u2.username}`)
        .query({ _token: testUserToken });

      expect(response.statusCode).toEqual(401);
    });

    test("throws error without token", async function () {
      let response = await request(app)
        .get(`/users/${u2.username}`);

      expect(response.statusCode).toEqual(401);
    });
  });

  describe("GET /users/:username/to", function () {
    test("can get a list of all messages sent to a user", async function () {
      m1 = await Message.get(m1.id);
      let response = await request(app)
        .get(`/users/${u1.username}/to`)
        .query({ _token: testUserToken });

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        messages: [{
          id: m1.id,
          body: "hi",
          sent_at: expect.any(String),
          read_at: m1.read_at,
          from_user: {
            username: "test2",
            first_name: "Test2",
            last_name: "Testy2",
            phone: "+14155550001"
          }
        }]
      });
    });
  });


});

afterAll(async function () {
  await db.end();
});
