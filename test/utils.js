/* eslint-env node, es6 */

var exec = require("child_process").exec;
var spawn = require("child_process").spawn;
var path = require("path");
var portfinder = require("portfinder");
var request = require("request");
var currentDirectory = __dirname;

var TEST_TOKEN = "4287e44985b04c7536c523ca6ea8e67c";

/**
 * setTestingDatabaseEnvironment
 *
 * Sets up environment variables for the testing database
 *
 * @returns {undefined}
 */
function setTestingDatabaseEnvironment() {
  process.env.DATABASE_URL = "http://localhost:7474";
  process.env.DATABASE_PASS = TEST_TOKEN;
}

/**
 * resetDatabaseCredentials
 *
 * @url {string} - the location of a neo4j database.
 * @returns {object} - a Promise that resolves when credential reset is done.
 */
function resetDatabaseCredentials(url) {
  return new Promise(function authorizationTokenPromise(resolve, reject) {
    request.post(url + "/user/neo4j/authorization_token", {
      json: {
        password: "neo4j",
        authorization_token: TEST_TOKEN
      }
    }, function onDoneAuthorizationToken(error, response, body) {
      if (error) {
        return reject(error);
      }

      return resolve(body);
    });
  });
}

/**
 * launchTestingDatabase
 *
 * Start a Neo4j instance running on the default port, calling
 * @done when it has finished booting up.
 *
 * @done {function}: Callback to call when the database is ready.
 * @returns {object}: Process handle for the database.
 */
function launchTestingDatabase(done) {
  var dbPath = path.resolve(path.join(currentDirectory,
                                      "..",
                                      "neo4j",
                                      "neo4j-community-2.2.0-M03",
                                      "bin",
                                      "neo4j"));
  var pid = spawn(dbPath, ["console"]);

  pid.stdout.on("data", function onDatabaseStdout(data) {
    var host = "http://localhost:7474";

    /* A nice little indent */
    process.stdout.write("    neo4j: " + data);
    if (data.indexOf("Remote interface") !== -1) {
      /* Immediately make a request to reset the
       * database credentials and clear all
       * data */
      resetDatabaseCredentials(host).then(function onResetDone() {
        done();
      });
    }
  });
  pid.stderr.on("data", function onDatabaseStderr(data) {
    process.stderr.write("    neo4j: " + data);
  });

  return pid;
}

/**
 * startServer
 *
 * Start the backend server, calling @done when the server is ready
 * and running.
 *
 * @port: Port to start the server on
 * @done: Callback to call when server is ready.
 */
function startServer(port, done) {
  var app = require("../app");  // eslint-disable-line global-require
  app.set("port", port);
  return app.listen(app.get("port"), done);
}

/**
 * startServerWithAutomaticPort
 *
 * Start the backend server, selecting a port automatically. The port
 * is guaranteed to be an available port, but not guaranteed to be
 * stable.
 *
 * @done: Callback to call when server is ready.
 */
function startServerWithAutomaticPort(done) {
  portfinder.getPort(function onPortReady(err, port) {
    var server;
    var url;

    try {
      server = startServer(port, function onServerReady() {
        url = "http://localhost:" + port;
        done(server, url);
      });
    } catch (e) {
      done(null, null, e);
    }
  });
}

/**
 * withOverriddenEnvironment
 *
 * Call callback with environment variables set from @environment,
 * restoring them once done. This function supports both synchronous
 * and asynchronous operation. When operating asynchronously, the changes
 * in the environment will persist until the done callback is called
 * by the callback function itself.
 *
 * @environment: Key-value pairs to override.
 * @callback: Function to call.
 * @done: Function to call when done in asynchronous mode.
 */
function withOverriddenEnvironment(environment, callback, done) {
  var backup = JSON.parse(JSON.stringify(process.env));
  Object.keys(environment).forEach(function assignKey(key) {
    process.env[key] = environment[key];
  });

  /* If done is passed, do this asynchronously. That means restoring
   * the environment once the callback has indicated that it is done */
  if (done) {
    callback(function onCallbackDone() {
      process.env = backup;
      done.apply(this, Array.prototype.slice.call(arguments));
    });
  } else {
    try {
      callback();
    } finally {
      process.env = backup;
    }
  }
}

/**
 * invokeProcessForReturnCode
 *
 * Invoke a process and get its return code, calling @done
 * with the return code once complete
 *
 * @command: Command to run
 * @options: Options to pass to child_process.exec
 * @done: Callback to invoke when done
 */
function invokeProcessForReturnCode(command, options, done) {
  exec(command, options, function onProcessDone(error) {
    done(error.code);
  });
}

module.exports = {
  startServer: startServer,
  startServerWithAutomaticPort: startServerWithAutomaticPort,
  withOverriddenEnvironment: withOverriddenEnvironment,
  invokeProcessForReturnCode: invokeProcessForReturnCode,
  launchTestingDatabase: launchTestingDatabase,
  setTestingDatabaseEnvironment: setTestingDatabaseEnvironment
};
