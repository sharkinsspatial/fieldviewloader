#! /usr/bin/env node
const upload = require('mapbox-upload');
const fs = require('fs');
const async = require('async');
const mapboxToken = process.argv[2];
const imageDirectory = process.cwd();
const path = require('path');
const ProgressBar = require('progress')

var files = fs.readdirSync(imageDirectory);
var file = files[0];
var filePath = path.resolve(imageDirectory, file);
var stat = fs.statSync(filePath);
var progress = upload({
            file: filePath,
            account: 'infraredbaron',
            accesstoken: mapboxToken,
            mapid: 'infraredbaron.' + 'test7',
            name: 'test7'
});
console.log();
var bar = new ProgressBar(' Uploading to Mapbox [:bar] :ptage % uploaded :estimated remaining',
                          {
                              complete: '=',
                              incomplete: ' ',
                              width: 30,
                              total: stat.size,
                              clear: true
                          });

progress.on('error', function(error){
    console.log(error);
});

progress.on('progress', function(p){
    var percentage = Math.round(p.percentage);
    var date = new Date(null);
    date.setSeconds(p.eta);
    bar.tick(p.delta, {
        'ptage': percentage,
        'estimated': date.getUTCHours() + ':'
        + date.getUTCMinutes() + ':'
        + date.getUTCSeconds()
    });
});

progress.once('finished', function(){
    console.log('Finished');
});
