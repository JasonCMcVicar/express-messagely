"use strict";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const { SECRET_KEY } = require("../config.js");

describe("Users Routes Test", function () {

  let testUserToken;

  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    let u1 = await User.register({
      username: "test1",
      password: "password",
      first_name: "Test1",
      last_name: "Testy1",
      phone: "+14155550000",
    });
    let u2 = await User.register({
      username: "test2",
      password: "password",
      first_name: "Test2",
      last_name: "Testy2",
      phone: "+14155550001",
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


//{users: [{username, first_name, last_name}, ...]}


});

afterAll(async function () {
  await db.end();
});
