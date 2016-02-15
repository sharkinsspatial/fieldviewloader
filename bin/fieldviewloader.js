#! /usr/bin/env node
const fs = require('fs');
const path = require('path');
//const argv = require('minimist')(process.argv.slice(2));
const fieldviewloader = require('../fieldviewloader');

//if (process.env.urlRoot) fieldviewloader.urlRoot = process.urlRoot;

fieldviewloader.urlRoot = 'http://fieldviewapi.herokuapp.com'
//fieldviewloader.urlRoot = 'http://localhost:3000';
var mapboxToken = process.env.MAPBOX_TOKEN;
var email = process.env.ADMIN_EMAIL;
var password = process.env.ADMIN_PASSWORD;

var options = {
    mapboxToken: mapboxToken,
    email: email,
    password: password,
    imageDirectory: process.cwd()
};
fieldviewloader(options);



