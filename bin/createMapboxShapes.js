#! /usr/bin/env node
const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const exec = require('child_process').exec;
const util = require('util');

var filepath = argv._[0];
var filename = filepath.split('.')[0];
var createFieldsShp = util.format('ogr2ogr fields.shp %s -t_srs "EPSG:4326" -sql "SELECT OBJECTID as id, FieldName as name from %s"', filepath, filename);
exec(createFieldsShp, function(error, stdout, stderr) {
    if(error) { console.log(error) }
});

var createCentroidsShp = util.format('ogr2ogr centroids.shp %s -t_srs "EPSG:4326" -dialect sqlite -sql "SELECT ST_Centroid(geometry), OBJECTID as id, FieldName as name from %s"', filepath, filename);
exec(createCentroidsShp, function(error, stdout, stderr) {
    if(error) { console.log(error) }
});
