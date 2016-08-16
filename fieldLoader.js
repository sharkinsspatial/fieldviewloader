const util = require('util');
const request = require('request');
const fs = require('fs');
const async = require('async');
const geojsonExtent = require('geojson-extent');
const credentials = require('./credentials');
module.exports = fieldloader;

function fieldloader(opts) {
    opts = fieldloader.opts(opts);
    credentials(opts, fieldloader.processFile);
}

fieldloader.opts = function(opts) {
    opts = opts || {};
    opts.email = opts.email || process.env.ADMIN_EMAIL;
    opts.password = opts.password || process.env.ADMIN_PASSWORD;
    opts.urlRoot = opts.urlRoot || fieldloader.urlRoot;
    return opts;
};

fieldloader.processFile = function(err, opts, credentials) {
    var url = util.format('%s/api/fields?access_token=%s', opts.urlRoot, credentials.id);
    //var json = JSON.parse(fs.readFileSync(opts.geojson, 'utf8'));
    var json = opts.geojson
    async.forEachLimit(json.features, 10, function(feature, callback) {
        var name;
        var id;
        if (feature.properties.farm) {
            id = 1000000 + feature.properties.farmId;
            name = feature.properties.farm + ' - ' + 'Mosaic';
        }
        else {
            id = feature.properties.id;
            name = feature.properties.name ? feature.properties.name : 'None';
        }
        var extent = geojsonExtent(feature);
        var field = {
            "name": name,
            "id": id,
            "farmId": feature.properties.farmId,
            "bounds": [[extent[0], extent[1]], [extent[2], extent[3]]]
        };
        if (!feature.properties.fieldId === 0) {
            console.log(util.format('Field %s has an invalid id'));
            callback();
        }
        if (!feature.properties.farmId || feature.properties.farmId === 0) {
            console.log(util.format('Field %s is missing a Farm', id));
            callback();
        }
        request.post(url, { json: field }, function(err, res) {
            if (err) return callback(err);
            if (res.statusCode === 200) {
                console.log(util.format('Field %s created', id));
            }
            callback();
        });
    }, function(err) {
        if (err) { console.log(err) }
    });
};

