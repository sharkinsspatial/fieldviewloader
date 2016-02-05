#! /usr/bin/env node
const upload = require('mapbox-upload');
const fs = require('fs');
const request = require('request');
const moment = require('moment');
const async = require('async');
const mapboxToken = process.argv[4];
const imageDirectory = process.cwd();
const path = require('path');
const gdal = require('gdal');

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
    if (res.statusCode != 200) { console.log('Invalid credentials') } else {
        var access_token = '?access_token=' + body.id;
        var files = fs.readdirSync(imageDirectory);
        async.forEachSeries(files, function(file, callback) {
            var components = file.split('_');
            if (components.length == 8) {
                var customerId = parseInt(components[7]);
                var fieldId = parseInt(components[6]);
                var fieldUrl = urlRoot + 'customers/' + customerId +
                    '/fields/rel/' + fieldId + access_token;
                var fieldExistsOptions = {
                    url: fieldUrl,
                    method: 'HEAD'
                };
                var fieldRelationOptions = {
                    url: fieldUrl,
                    method: 'PUT'
                };

                var productType = components[4];
                var date = moment(components[5], 'YY-MM-DD').format('YYYY-MM-DD');
                var imageExistsUrl = urlRoot + 'images' + access_token +
                    '&filter[where][fieldId]=' + fieldId +
                    '&filter[where][customerId]=' + customerId +
                    '&filter[where][collectionDate]=' + date;
                var imageExistsOptions = {
                    url: imageExistsUrl,
                    method: 'GET'
                };

                var filePath = path.resolve(imageDirectory, file);

                async.waterfall([
                function(callback) {
                    var src = gdal.open(filePath);
                    var width = src.rasterSize.x;
                    var height = src.rasterSize.y;
                    var bandCount = src.bands.count();
                    var datatype = src.bands.get(1).datatype;
                    src.close();
                    var dataset = gdal.open(filePath, 'r+', 'GTiff', width, height, bandCount, datatype);
                    dataset.bands.forEach(function(band) {
                        band.noDataValue = 0;
                        band.flush();
                    });
                    dataset.flush();
                    dataset.close();
                    console.log('No data values set to 0');
                    callback();
                },
                async.apply(request, fieldExistsOptions),
                function(res, body, callback) {
                    if (res.statusCode === 404) {
                        request(fieldRelationOptions, function(error, res) {
                            console.log('Relationship created');
                            callback();
                        });
                    }
                    else {
                        callback();
                    }
                },
                async.apply(request, imageExistsOptions),
                function(res, body, callback)   {
                    var images = JSON.parse(body);
                    if (images.length == 0) {
                        var imageCreateUrl = urlRoot + 'images' + access_token;
                        var imageCreateOptions = {
                            url: imageCreateUrl,
                            method: 'POST',
                            json: {
                                "collectionDate": date,
                                "customerId": customerId,
                                "fieldId": fieldId
                            }
                        };
                        request(imageCreateOptions, function(error, res, body) {
                            callback(null, res, body);
                        });
                    }
                    else {
                        console.log('Image exists for ' + file);
                        callback(null, res, images[0]);
                    }
                },
                function(res, body, callback) {
                    var image = body;
                    var productExitsUrl = urlRoot + 'images/' + image.id
                        + '/products' + access_token
                        + '&filter[where][productType]=' + productType;
                    request(productExitsUrl, function(error, res, body) {
                        var products = JSON.parse(body);
                        if (products.length === 0) {
                           callback(null, null, image);
                        }
                        else {
                            console.log('Product exsits for ' + file);
                            callback(true);
                        }
                    });
                },
                function(res, body, callback) {
                    var image = body;
                    var productCreateUrl = urlRoot + 'images/' + image.id
                        + '/products' + access_token;
                    var productCreateOptions = {
                        url: productCreateUrl,
                        method: 'POST',
                        json: {
                            "productType": productType
                        }
                    };
                    request(productCreateOptions, function(error, res, body) {
                        callback(null, res, body);
                    });
                },
                function(res, body, callback) {
                    var product = body;
                    var filePath = path.resolve(imageDirectory, file);
                    var progress = upload({
                        file: filePath,
                        account: 'infraredbaron',
                        accesstoken: mapboxToken,
                        mapid: 'infraredbaron.' + product.id,
                        name: product.id
                    });

                    progress.on('error', function(error){
                        callback(error);
                    });


                    progress.on('progress', function(p){
                        console.log(p);
                    });


                    progress.once('finished', function(){
                        callback(null);
                    });
                }
                ],
                function(error) {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        console.log('Loaded ' + file);
                    }
                    callback();
                });
        }
        else {
            console.log('Invalid file name ' + file);
        }
    });
    }
});
