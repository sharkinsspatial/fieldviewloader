const upload = require('mapbox-upload');
const fs = require('fs');
const request = require('request');
const moment = require('moment');
const async = require('async');
const path = require('path');
const util = require('util');
const url = require('url');
const ProgressBar = require('progress');
const setNoData = require('./setNoData');
const corners = require('./corners');

module.exports = fieldviewloader;

function fieldviewloader(opts) {
    opts = fieldviewloader.opts(opts);
    fieldviewloader.getCredentials(opts, fieldviewloader.processFiles);
}

fieldviewloader.opts = function(opts) {
    opts = opts || {};
    opts.mapboxToken = opts.mapboxToken || process.env.MAPBOX_TOKEN;
    opts.email = opts.email || process.env.ADMIN_EMAIL;
    opts.password = opts.password || process.env.ADMIN_PASSWORD;
    opts.urlRoot = opts.urlRoot || fieldviewloader.urlRoot;
    opts.imageDirectory = opts.imageDirectory;
    if (!opts.imageDirectory)
        throw new Error('A valid image directory is required');
    return opts;
};

fieldviewloader.getCredentials = function(opts, callback){
    try { opts = fieldviewloader.opts(opts) }
    catch (err) { return callback(err) }
    var url = util.format('%s/api/CustomerMembers/login', opts.urlRoot);
    request.post(url, { json: {
        email: opts.email,
        password: opts.password
    }}, function(err, res, body) {
        callback(err, res, body, opts);
    });
};

fieldviewloader.processFiles = function(err, res, body, opts) {
    if (err) {
        throw err;
    }
    else if (res.statusCode !== 200) {
        throw new Error(body && body.message || 'Invalid credentials');
    }
    var token = body.id;
    var files = fs.readdirSync(opts.imageDirectory);
    async.forEachSeries(files, function(file, callback) {
        var urls = fieldviewloader.parseFilename(opts.urlRoot, token,
                                                 file, callback);
        if (urls instanceof Error) {
            console.log(urls.message);
        }
        else {
            fieldviewloader.processFile(urls, file, opts, callback);
        }
    }, function(err) {
        if (err) { console.log(err) }
    });
};

fieldviewloader.processFile = function(urls, file, opts, callback) {
    async.waterfall([
        async.apply(fieldviewloader.getBounds, opts, file, urls),
        async.apply(fieldviewloader.setNodata, opts, file),
        async.apply(fieldviewloader.checkFieldExists, urls),
        async.apply(fieldviewloader.updateMosaicBounds, urls),
        async.apply(request, { url: urls.fieldRelUrl, method: 'HEAD' }),
        async.apply(fieldviewloader.handleFieldRel, urls),
        async.apply(request, { url: urls.imageExistsUrl, method: 'GET' }),
        async.apply(fieldviewloader.handleImageExist, urls),
        async.apply(fieldviewloader.checkProductExist, urls),
        async.apply(fieldviewloader.mapboxUpload, urls, file, opts),
        async.apply(fieldviewloader.createProduct, urls)
    ],
    function(error) {
        if (error) {
            callback(error);
        }
        else {
            callback();
            console.log('Loaded ' + file);
        }
    });
};

fieldviewloader.parseFilename = function(urlRoot, access_token, file) {
    var apiRoot = url.resolve(urlRoot, 'api');
    var components = file.split('_');
    var error = new Error('Invalid file name ' + file);
    if (components.length !== 8) {
        return error;
    }
    var customerComponents = components[7].split('-');
    if (customerComponents.length !== 2) {
        return error;
    }
    var customerId = parseInt(customerComponents[0]);
    var fieldId = parseInt(components[6]);
    var fieldUrl = util.format('%s/fields/%s?access_token=%s',apiRoot, fieldId,
                               access_token);
    var mosaic = fieldId > 1000000 ? true : false;
    var fieldRelUrl = util.format('%s/customers/%s/fields/rel/%s?access_token=%s',
                               apiRoot, customerId, fieldId, access_token);
    var productType = components[4];
    var collectionDate = moment(components[5], 'YY-MM-DD').format('YYYY-MM-DD');
    var query = util.format('filter[where][fieldId]=%s' +
                            '&filter[where][customerId]=%s' +
                            '&filter[where][collectionDate]=%s' +
                            '&access_token=%s',
                            fieldId, customerId, collectionDate, access_token);
    var imageExistsUrl = util.format('%s/images?%s', apiRoot, query);
    var imageCreateUrl = util.format('%s/images?access_token=%s', apiRoot,
                                     access_token);
    var imageCreateData = { customerId: customerId, fieldId: fieldId,
        collectionDate: collectionDate};

    var productId = customerId + components[6] + components[5] + components[4];
    var productData = { productId: productId, productType: productType,
        access_token: access_token, apiRoot: apiRoot };
    return { fieldRelUrl: fieldRelUrl, imageExistsUrl: imageExistsUrl,
        imageCreateUrl: imageCreateUrl, imageCreateData: imageCreateData,
        productData: productData, fieldUrl: fieldUrl, mosaic: mosaic
    };

};

fieldviewloader.handleFieldRel = function(urls, res, body, callback) {
    if (res.statusCode === 404) {
        request.put(urls.fieldRelUrl, function(error, res) {
            console.log('Relationship created');
            if (error) { callback(error); }
            callback();
        });
    }
    else {
        console.log('Relationship exists');
        callback();
    }
};

fieldviewloader.handleImageExist = function(urls, res, body, callback) {
    var images = JSON.parse(body);
    if (images.length == 0) {
        console.log('Creating image');
        request.post(urls.imageCreateUrl, { json: urls.imageCreateData },
                     function(error, res, body) {
                         if (error) { callback(error); }
                         callback(null, res, body);
                     });
    }
    else {
        console.log('Image exists');
        callback(null, res, images[0]);
    }
};

fieldviewloader.checkProductExist = function(urls, res, body, callback) {
    var image = body;
    var productExistsUrl = util.format('%s/images/%s/products?access_token=%s' +
        '&filter[where][productType]=%s', urls.productData.apiRoot, body.id,
            urls.productData.access_token, urls.productData.productType);

    request.get(productExistsUrl, function(error, res, body) {
        if (error) { callback(error); }
        var products = JSON.parse(body);
        if (products.length === 0) {
            callback(null, null, image);
        }
        else {
            console.log('Product exists');
            callback(null, null, null);
        }
    });

};

fieldviewloader.createProduct = function(urls, res, body, callback) {
    if (!body) {
        callback(null);
    } else {
        var productCreateUrl = util.format('%s/images/%s/products?access_token=%s',
            urls.productData.apiRoot,
            body.id, urls.productData.access_token);

            request.post(productCreateUrl, { json: { id: urls.productData.productId,
                         productType: urls.productData.productType }}, function(error, res, body) {
                             console.log('Product created');
                             if (error) { callback(error); }
                             callback(null);
                         });
    }
};

fieldviewloader.mapboxUpload = function(urls, file, opts, res, body, callback) {
    if (!body) {
        callback(null, null, null);
    } else {
        console.log('Uploading to Mapbox');
        var filePath = path.resolve(opts.imageDirectory, file);
        var stat = fs.statSync(filePath);
        console.log();
        var bar = new ProgressBar('Uploading to Mapbox [:bar] :ptage % uploaded :estimated remaining',
              {
                  complete: '=',
                  incomplete: ' ',
                  width: 30,
                  total: stat.size,
                  clear: true
              });

              var progress = upload({
                  file: filePath,
                  account: 'infraredbaron',
                  accesstoken: opts.mapboxToken,
                  mapid: 'infraredbaron.' + urls.productData.productId,
                  name: urls.productData.productId
              });

              progress.on('error', function(error){
                  callback(error);
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
                  callback(null, null, body);
              });
    }
};

fieldviewloader.updateMosaicBounds = function(urls, callback) {
    if (urls.mosaic) {
        if (!urls.bounds) { callback(new Error('No bounds defined')) }
        request.put(urls.fieldUrl, { json: { bounds: urls.bounds } },
                    function(error, res) {
                        if (error) { callback(error); }
                        callback();
                    });
    } else {
        callback();
    }
};

fieldviewloader.setNodata = function(opts, file, callback) {
    var filePath = path.resolve(opts.imageDirectory, file);
    setNoData(filePath);
    callback();
};

fieldviewloader.getBounds = function(opts, file, urls, callback) {
    var filePath = path.resolve(opts.imageDirectory, file);
    urls.bounds = corners(filePath);
    callback();
};

fieldviewloader.checkFieldExists = function(urls, callback) {
    request.get(urls.fieldUrl, function(error, res, body) {
        if (res.statusCode === 404) {
            callback(new Error('The field for this image has not been created yet'));
        } else {
            callback();
        }
    });
};
