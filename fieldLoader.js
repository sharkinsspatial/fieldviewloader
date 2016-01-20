#! /usr/bin/env node
const fs = require('fs');
const geojsonExtent = require('geojson-extent');
const async = require('async');
const request = require('request');
const path = require('path');

//var urlRoot = 'http://localhost:3000/api/'
var urlRoot = 'http://fieldviewapi.herokuapp.com/api/'
var accesstokenOptions = {
    url: urlRoot + 'CustomerMembers/login',
    method: 'POST',
    json: {"email": process.argv[2],
        "password": process.argv[3]
    }
};

request(accesstokenOptions, function(error, res, body) {
    if (res.statusCode === 401) { console.log('Invalid credentials') } else {
        var access_token = '?access_token=' + body.id;
        var options = {
            url: urlRoot + 'fields' + access_token,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        };

        var json = JSON.parse(fs.readFileSync(process.argv[4], 'utf8'));
        async.forEachLimit(json.features, 10, function(feature, callback) {
            console.log(feature.properties.id);
            var extent = geojsonExtent(feature);
            var name = feature.properties.name ? feature.properties.name : 'None';
            var field = {"name": name,
                "id": feature.properties.id,
                "farmId": feature.properties.farmId,
                "bounds": [[extent[0], extent[1]], [extent[2], extent[3]]]
            };
            options.json = field;
            request(options, function(err, res) {
                if (err) return callback(err);
                callback();
            });
        }, function(err) {
            console.log(err);
        });
    }
});
