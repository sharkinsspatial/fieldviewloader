#! /usr/bin/env node
const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const exec = require('child_process').exec;
const util = require('util');
//const AdmZip = require('adm-zip');

var filepath = argv._[0];
var filename = filepath.split('.')[0];
var createFieldsShp = util.format('ogr2ogr fields.shp %s -overwrite -t_srs "EPSG:4326" -sql "SELECT FieldID as id, FieldName as name from %s"', filepath, filename);
exec(createFieldsShp, function(error, stdout, stderr) {
    if(error) { console.log(error) }
    //else {
        //var zip = new AdmZip();
        //addShapfilesToZip('fields', zip);
        //zip.writeZip(path.join(process.cwd(),'fields.zip'));
    //}
});

var createCentroidsShp = util.format('ogr2ogr labels.shp %s -overwrite -t_srs "EPSG:4326" -dialect sqlite -sql "SELECT ST_Centroid(geometry), FieldID as id, FieldName as name from %s"', filepath, filename);
exec(createCentroidsShp, function(error, stdout, stderr) {
    if(error) { console.log(error) }
    //else {
        //var zip = new AdmZip();
        //addShapfilesToZip('labels', zip);
        //zip.writeZip(path.join(process.cwd(),'labels.zip'));
    //}
});

//function addShapfilesToZip (name, zip) {
    //zip.addLocalFile(path.join(process.cwd(), util.format('%s.dbf', name)));
    //zip.addLocalFile(path.join(process.cwd(), util.format('%s.prj', name)));
    //zip.addLocalFile(path.join(process.cwd(), util.format('%s.shp', name)));
    //zip.addLocalFile(path.join(process.cwd(), util.format('%s.shx', name)));
//}
