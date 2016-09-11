var expect = require("chai").expect;
var request = require("supertest");
var dbUtils = require("../db/utils");
var testUtils = require("./utils");
var exec = require("child_process").exec;
var URL = require("url");


dbUtils.validateEnvironment("mocha test");
describe("Booting the server", function () {
  var url = null;
  var server = null;

  it("should fail if DATABASE_URL is not set", function (done) {
    testUtils.withOverriddenEnvironment({
      DATABASE_URL: undefined
    }, function (done) {
      testUtils.startServerWithAutomaticPort(function (server, port, err) {
        expect(err).to.be.an("error");
        done();
      });
    }, function () {
      done();
    });
  });

  it("should fail if two servers are on the same port", function (done) {
    testUtils.startServerWithAutomaticPort(function (server, url, err) {
      var port = URL.parse(url).port;
      testUtils.invokeProcessForReturnCode("node bin/www", {
        env: {
          PORT: String(port)
        }
      },
            function (code) {
              expect(code).to.equal(1);
              done();
            });
    });
  });

  it("should succeed if DATABASE_URL is set", function (done) {
    testUtils.startServerWithAutomaticPort(function (server, url, err) {
      expect(err).to.be.undefined;
      expect(server).to.be.defined;
      expect(URL.parse(url).port).to.be.at.least(1000);
      done();
    });
  });
});