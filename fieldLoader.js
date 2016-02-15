const util = require('util');
const request = require('request');
const fs = require('fs');
const async = require('async');
const geojsonExtent = require('geojson-extent');
module.exports = fieldloader;

function fieldloader(opts) {
    opts = fieldloader.opts(opts);
    fieldloader.getCredentials(opts, fieldloader.processFile);
}

fieldloader.opts = function(opts) {
    opts = opts || {};
    opts.email = opts.email || process.env.ADMIN_EMAIL;
    opts.password = opts.password || process.env.ADMIN_PASSWORD;
    opts.urlRoot = opts.urlRoot || fieldloader.urlRoot;
    return opts;
};

fieldloader.getCredentials = function(opts, callback){
    try { opts = fieldloader.opts(opts) }
    catch (err) { return callback(err) }
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
};

fieldloader.processFile = function(err, opts, credentials) {
    var url = util.format('%s/api/fields?access_token=%s', opts.urlRoot, credentials.id);
    var json = JSON.parse(fs.readFileSync(opts.geojson, 'utf8'));
    async.forEachLimit(json.features, 5, function(feature, callback) {
        var extent = geojsonExtent(feature);
        var name = feature.properties.name ? feature.properties.name : 'None';
        var field = {"name": name,
            "id": feature.properties.id,
            "farmId": feature.properties.farmId,
            "bounds": [[extent[0], extent[1]], [extent[2], extent[3]]]
        };
        request.post(url, { json: field }, function(err, res) {
            if (err) return callback(err);
            if (res.statusCode === 200) {
                console.log(util.format('Field %s created', feature.properties.id));
            }
            callback();
        });
    }, function(err) {
        console.log(err);
    });
};

