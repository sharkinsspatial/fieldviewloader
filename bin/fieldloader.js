#! /usr/bin/env node
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));
const fieldloader = require('../fieldloader');
const exec = require('child_process').exec;
const util = require('util');
//if (process.env.urlRoot) fieldviewloader.urlRoot = process.urlRoot;

fieldloader.urlRoot = 'http://fieldviewapi.herokuapp.com'
//fieldloader.urlRoot = 'http://localhost:3000';
var email = process.env.ADMIN_EMAIL;
var password = process.env.ADMIN_PASSWORD;
var filepath = argv._[0];
var filename = filepath.split('.')[0];
var createGeojson = util.format('ogr2ogr -f "GeoJSON" newfields.geojson %s -t_srs "EPSG:4326" -sql "SELECT FieldID as id, FieldName as name, FarmID as farmId from %s"', filepath, filename);
var createMosaicGeojson = util.format('ogr2ogr -f "GeoJSON" mosaicfields.geojson %s -t_srs "EPSG:4326" -dialect sqlite -sql "SELECT ST_Union(geometry), FarmID as farmId, Farm as farm FROM %s GROUP BY FarmID, Farm"', filepath, filename);
exec(createGeojson, function(error, stdout, stderr) {
    var options = {
        email: email,
        password: password,
        geojson: 'newfields.geojson'
    };

    if(error) { console.log(error) }
    fieldloader(options);
});
exec(createMosaicGeojson, function(error, stdout, stderr) {
    var options = {
        email: email,
        password: password,
        geojson: 'mosaicfields.geojson'
    };

    if(error) { console.log(error) }
    fieldloader(options);
});



