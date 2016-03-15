#! /usr/bin/env node
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));
const farmloader = require('../farmloader');

farmloader.urlRoot = 'http://fieldviewapi.herokuapp.com'
//farmloader.urlRoot = 'http://localhost:3000';
var email = process.env.ADMIN_EMAIL;
var password = process.env.ADMIN_PASSWORD;
var filepath = argv._[0];
var filename = filepath.split('.')[0];

var options = {
    email: email,
    password: password,
    geojson: filepath
}

farmloader(options);

