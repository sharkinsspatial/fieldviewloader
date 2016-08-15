#! /usr/bin/env node
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));
const fieldloader = require('../fieldloader');
const util = require('util');
const ogr2ogr = require('ogr2ogr');
//if (process.env.urlRoot) fieldviewloader.urlRoot = process.urlRoot;

fieldloader.urlRoot = 'http://fieldviewapi.herokuapp.com'
//fieldloader.urlRoot = 'http://localhost:3000';
var email = process.env.ADMIN_EMAIL;
var password = process.env.ADMIN_PASSWORD;
var filepath = argv._[0];
var filename = filepath.split('.')[0];

var createGeojson = ogr2ogr(filepath).options(['-sql',
                         util.format('SELECT FieldID as id, FieldName as name, '
                                     + 'FarmID as farmId from %s', filename)])

var createMosaicGeojson = ogr2ogr(filepath).options(['-dialect', 'sqlite',
                            '-sql', util.format('SELECT ST_Union(geometry), '
                                + 'FarmID as farmId, Farm as farm FROM %s '
                                + 'GROUP BY FarmID, Farm', filename)]);

createGeojson.exec(function(error, data) {
    if(error) { console.log(error) }
    var options = {
        email: email,
        password: password,
        geojson: data
    };
    fieldloader(options);
});

if(argv.batch) {
    createMosaicGeojson.exec(function(error, data) {
        if(error) { console.log(error) }
        var options = {
            email: email,
            password: password,
            geojson: data
        };
        fieldloader(options);
    });
}

