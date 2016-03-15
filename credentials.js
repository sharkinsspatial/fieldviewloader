const request = require('request');
const util = require('util');
module.exports = credentials;

function credentials(opts, callback){
    var url = util.format('%s/api/CustomerMembers/login', opts.urlRoot);
    var accesstokenOptions = {
        url: url,
        method: 'POST',
        json: {"email": opts.email,
            "password": opts.password
        }
    };

    request(accesstokenOptions, afterRequest);
    function afterRequest(err, res, body) {
        if (err) { throw err; }
        if (res.statusCode !== 200) {
            err = new Error(body && body.message || 'Invalid credentials');
            err.code = res.statusCode;
            throw (err);
        } else {
            return callback(null, opts, body);
        }
    }
}

