const fs = require('fs');
const util = require('util');
const credentials = require('./credentials');
const request = require('request');
const async = require('async');
module.exports = farmloader;

function farmloader(opts) {
    opts = farmloader.opts(opts);
    credentials(opts, farmloader.processFile);
}

farmloader.opts = function(opts) {
    opts = opts || {};
    opts.email = opts.email || process.env.ADMIN_EMAIL;
    opts.password = opts.password || process.env.ADMIN_PASSWORD;
    opts.urlRoot = opts.urlRoot || farmloader.urlRoot;
    return opts;
};


farmloader.processFile = function(err, opts, credentials) {
    var url = util.format('%s/api/farms?access_token=%s', opts.urlRoot, credentials.id);
    var json = JSON.parse(fs.readFileSync(opts.geojson, 'utf8'));

    async.forEachLimit(json.farms, 10, function(farm, callback) {
        var farmJson = {
            "name": farm.name,
            "id": farm.id
        }
        request.post(url, { json: farmJson}, function(err, res) {
            if (err) return callback(err);
            if (res.statusCode === 200) {
                console.log(util.format('Farm %s created', farm.id));
            }
            callback();
        });

    }, function(err) {
        console.log(err);
    });
};
