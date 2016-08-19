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
    var errorReports = [];
    async.forEachLimit(opts.geojson.features, 10, function(feature, forEachCallback) {
        if (!fieldloader.featureIsValid(feature, errorReports)) {
            forEachCallback()
        } else {
            var field = fieldloader.createField(feature);
            var farmUrl = util.format('%s/api/farms/%s?access_token=%s',
                  opts.urlRoot, feature.properties.farmId, credentials.id);
                  async.waterfall([
                      async.apply(fieldloader.checkFarmExists, farmUrl),
                      async.apply(fieldloader.loadField, field, url, errorReports)
                  ],
                  function(err) {
                      if (err) { forEachCallback(err); }
                      forEachCallback();
                  });
        }
        }, function(err) {
            if (err) { console.log(err) }
            errorReports.forEach(function(report) {
                console.log(report);
            });
        });
};

fieldloader.featureIsValid = function(feature, errorReports) {
    var isValid = true;
    if (!feature.properties.farm && !feature.properties.id ||
        !feature.properties.farm && feature.properties.id === 0) {
            errorReports.push('Field has an invalid id');
            isValid = false;
    } else if (!feature.properties.farmId || feature.properties.farmId === 0) {
        errorReports.push(util.format('Field %s is missing a Farm',
                                      feature.properties.id));
        isValid = false;
    }
    return isValid;
};

fieldloader.createField = function(feature) {
    var id;
    var name;
    if (feature.properties.farm) {
        id = 1000000 + feature.properties.farmId;
        name = feature.properties.farm + ' - ' + 'Mosaic';
    } else {
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
    return field;
};

fieldloader.loadField = function(field, url, errorReports, farmExists, callback) {
    if (farmExists) {
        request.post(url, { json: field }, function(err, res) {
            if (err) return callback(err);
            if (res.statusCode === 200) {
                console.log(util.format('Field %s created', field.id));
            }
            callback();
        });
    } else {
        errorReports.push(util.format('For field %s, farm %s does not exist in the database',
                                field.id, field.farmId));
        callback();
    }

};

fieldloader.checkFarmExists = function(farmUrl, callback) {
    request.get(farmUrl, function(err, res) {
        if (res.statusCode === 200) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    });
};
