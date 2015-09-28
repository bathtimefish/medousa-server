'use strict';
/*
 'use strict' is not required but helpful for turning syntactical errors into true errors in the program flow
 http://www.w3schools.com/js/js_strict.asp
*/

/*
 Modules make it possible to import JavaScript files into your application.  Modules are imported
 using 'require' statements that give you a reference to the module.

  It is a good idea to list the modules that your application depends on in the package.json in the project root
 */
var util = require('util');
var redis = require("redis");

/*
 Once you 'require' a module you can reference the things that it exports.  These are defined in module.exports.

 For a controller in a127 (which this is) you should export the functions referenced in your Swagger document by name.

 Either:
  - The HTTP Verb of the corresponding operation (get, put, post, delete, etc)
  - Or the operationId associated with the operation in your Swagger document

  In the starter/skeleton project the 'get' operation on the '/hello' path has an operationId named 'hello'.  Here,
  we specify that in the exports of this module that 'hello' maps to the function named 'hello'
 */
module.exports = {
  sender: sender,
  caster: caster
};


// DB設定情報
var dbConfig = {
    'REDIS_HOST': process.env.REDIS_HOST,
    'REDIS_PORT': process.env.REDIS_PORT,
    'REDIS_PASSWORD': process.env.REDIS_PASSWORD
};
// Redis Connection
var redisClient = redis.createClient(dbConfig.REDIS_PORT, dbConfig.REDIS_HOST, {no_ready_check: true});
redisClient.auth(dbConfig.REDIS_PASSWORD, function() {
    console.log('Redis client connected');
});


/*
  Functions in a127 controllers used for operations should take two parameters:

  Param 1: a handle to the request object
  Param 2: a handle to the response object
 */
function sender(req, res) {
  // variables defined in the Swagger document can be referenced using req.swagger.params.{parameter_name}
  var key = req.swagger.params.key.value || null;
  var id  = req.swagger.params.id.value || null;
  var ret = {};
  if(!key || !id) {
    ret = {
        "message": "invalid parametors"
    };
    res.status(400);
    res.json(ret);
    return;
  }
  redisClient.set(key, id, redis.print);
  redisClient.expire(key, 10 * 60);   // 10min
  ret = {
      "success": true,
      "id": id,
      "message": "OK"
  };
  // this sends back a JSON response which is a single string
  res.json(ret);
}

function caster(req, res) {
  // variables defined in the Swagger document can be referenced using req.swagger.params.{parameter_name}
  var key = req.swagger.params.key.value || null;
  var ret = {};
  if(!key) {
    ret = {
        "message": "key not specified"
    };
    res.status(404);
    res.json(ret);
    return;
  }
  redisClient.get(key, function(err, reply) {
    if(err) {
      ret = {
        "message": err
      };
      res.status(400);
      res.json(ret);
      return;
    };
    var id = reply || null;
    if(id) {
      ret = {
        "success": true,
        "id": id,
        "message": "OK"
      };
    } else {
      ret = {
        "message": "key not found"
      };
      res.status(404);
    }
    // this sends back a JSON response which is a single string
    res.json(ret);
  });
}
