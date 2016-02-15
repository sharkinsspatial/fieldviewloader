#! /usr/bin/env node
const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const fieldloader = require('../fieldloader');

//if (process.env.urlRoot) fieldviewloader.urlRoot = process.urlRoot;

fieldloader.urlRoot = 'http://fieldviewapi.herokuapp.com'
//fieldloader.urlRoot = 'http://localhost:3000';
var email = process.env.ADMIN_EMAIL;
var password = process.env.ADMIN_PASSWORD;
var filepath = argv._[0];

var options = {
    email: email,
    password: password,
    geojson: filepath
};
console.log(options);
fieldloader(options);



