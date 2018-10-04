/**
 * Module dependencies
 */
var should = require("should");
var envs = require("..");

// enable tracing

envs.trace = true;

describe("envs", function() {
  it("should return the correct values", function() {
    var NODE_ENV = envs("NODE_ENV", "production")
      , NONEXISTANT = envs("NONEXISTANT", "i do exist");

    NODE_ENV.should.eql("test");
    NONEXISTANT.should.eql("i do exist");
  });

  it("should populate the `usages` variable", function() {
    envs("LINENO_TEST", "test123"); // If this line number changes, it will break the test

    envs.usages.LINENO_TEST[0].lineno.should.include("17");
  });

  it("should only add a line once", function() {
    [1,2,3,4,5].forEach(function() {
      envs("MULTIPLE_VAR");
    });
    envs.usages.MULTIPLE_VAR.should.have.length(1);
  });

  it("should parse the integer", function() {
    envs.int("TEST_INT").should.equal(123);
  });

  it("should parse a default", function() {
    envs.int("NONEXISTANT", "456").should.equal(456);
  });

  it("should use a default", function() {
    envs.int("NONEXISTANT", 456).should.equal(456);
  });

  it("should parse the float", function() {
    envs.float("TEST_FLOAT").should.equal(123.123);
  });

  it("should parse a default", function() {
    envs.float("NONEXISTANT", "456.456").should.equal(456.456);
  });

  it("should use a default", function() {
    envs.float("NONEXISTANT", 456.456).should.equal(456.456);
  });
});
