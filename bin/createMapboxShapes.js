#! /usr/bin/env node
const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const util = require('util');
const ogr2ogr = require('ogr2ogr');

var filepath = argv._[0];
var filename = filepath.split('.')[0];

var fields = ogr2ogr(filepath).options(['-overwrite', '-nln', 'fields',
                                '-sql', util.format('SELECT FieldID as '
                                + 'id, FieldName as name from %s', filename)])
                                .format('ESRI Shapefile')
                                .stream()
fields.pipe(fs.createWriteStream('fields.zip'));

var labels = ogr2ogr(filepath).options(['-overwrite', '-nln', 'labels',
                                   '-dialect', 'sqlite', '-sql', util.format(
                                    'SELECT ST_Centroid(geometry), '
                                    + 'FieldID as id, FieldName as name '
                                    + 'from %s', filename)])
                                    .format('ESRI Shapefile')
                                    .stream()
labels.pipe(fs.createWriteStream('labels.zip'));
