/*eslint-disable no-console */
const test = require('tape');
const http = require('http');
const url = require('url');
const fieldviewloader = require('../fieldviewloader');
fieldviewloader.urlRoot = 'http://localhost:3003';
const request = require('request');
const sinon = require('sinon');

var server;

function opts(extend) {
    extend = extend || {};
    var options = {
        mapboxToken: '1',
        email: 'test@test.com',
        password: 'test',
        imageDirectory: '~/projects/fieldviewdata/testimage'
    };
    for (var key in extend) options[key] = extend[key];
    return options;
}

test('fieldviewloader.parseFilename', function(t) {
    var fileName = 'RD Offutt_3 Mile_Mosaic_All_CIR_150614_1000001_2-1.tif';
    var urls = fieldviewloader.parseFilename('http://localhost',
                                    '1', fileName);
    t.equal(urls.fieldUrl,
            'http://localhost/api/customers/2/fields/rel/'
                + '1000001?access_token=1');
    t.equal(urls.imageExistsUrl,
            'http://localhost/api/images?filter'
            + '[where][fieldId]=1000001&filter[where][customerId]=2&filter'
            + '[where][collectionDate]=2015-06-14&access_token=1');
    t.equal(urls.imageCreateUrl, 'http://localhost/api/images?access_token=1');

    t.deepEqual(urls.imageCreateData, { collectionDate: '2015-06-14',
                                            fieldId: 1000001,
                                            customerId: 2 });
    t.deepEqual(urls.productData, { productId: '21000001150614CIR',
                                        productType: 'CIR',
                                        access_token: '1',
                                        apiRoot: 'http://localhost/api'
    });

    var shortfileName = 'RD Offutt_3 Mile_Mosaic_All_CIR_150614_1000001.tif';

    var error = fieldviewloader.parseFilename('http://localhost',
                                    '1', shortfileName);
    t.equal(error.message, 'Invalid file name ' + shortfileName);
    var wrongCustomer =  'RD Offutt_3 Mile_Mosaic_All_CIR_150614_1000001_21.tif';
    var customerError = fieldviewloader.parseFilename('http://localhost',
                                                      '1', wrongCustomer);
    t.equal(customerError.message, 'Invalid file name ' + wrongCustomer);
    t.end();
});

test('fieldviewloader.opts', function(t) {
    t.throws(function() { fieldviewloader.opts({}) }, null,
            'No image directory throws an error');
    t.end();
});

test('fieldviewloader.getCredentials calls callback correctly', function(t) {
    t.plan(2);
    var options = opts();
    sinon.stub(request, 'post').yields(null, null, { id: 'validtoken'}, options);

    fieldviewloader.getCredentials(options, function(err, res, body, opts) {
        t.equal(body.id, 'validtoken');
        t.deepEqual(opts, options);
        request.post.restore();
    });
});

test('fieldviewloader.handleFieldRel', function(t) {
    t.plan(1);
    sinon.stub(request, 'put').yields();
    fieldviewloader.handleFieldRel({ fieldUrl: 'test'}, { statusCode: 404 }, null,
                   function() {
                        t.true(request.put.called,
                            'PUTs field relationship when it does not exist');
                        request.put.restore();
                   });
});

test('fieldviewloader.handleFieldRel', function(t) {
    t.plan(1);
    sinon.stub(request, 'put').yields();
    fieldviewloader.handleFieldRel({ fieldUrl: 'test'}, { statusCode: 200 }, null,
                   function() {
                        t.false(request.put.called,
                            'Does not recreate relationship');
                        request.put.restore();
                   });
});

test('fieldviewloader.handleImageExist', function(t) {
    t.plan(2);
    sinon.stub(request, 'post').yields(null, null, { id: 1 });
    fieldviewloader.handleImageExist({ imageCreateUrl: 'test' }, null, '[]',
                                     function(error, res, body) {
                                         t.true(request.post.called,
                                               'Creates new Image with POST');
                                         t.equal(body.id, 1,
                                                 'Calls callback with Image');
                                         request.post.restore();
                                     });
});

test('fieldviewloader.handleImageExist', function(t) {
    t.plan(2);
    sinon.stub(request, 'post').yields(null, null, null);
    fieldviewloader.handleImageExist({ imageCreateUrl: 'test' }, null, '[{"id": 1}]',
                                     function(error, res, body) {
                                         t.false(request.post.called,
                                               'Does not recreate Image');
                                         t.equal(body.id, 1,
                                                 'Calls callback with existing Image');
                                         request.post.restore();
                                     });
});

test('fieldviewloader.checkProductExist', function(t) {
    t.plan(2);
    sinon.stub(request, 'get').yields(null, null, '[{"id": 1}]');
    var urls = { productData: {
                apiRoot: 'http://localhost/api',
                access_token: 1,
                productType: 'CIR'
    }};
    var url = 'http://localhost/api/images/test/products?access_token=1' +
        '&filter[where][productType]=CIR'

    fieldviewloader.checkProductExist(urls, null, { id: 'test' },
        function(error, res, body) {
            t.true(request.get.calledWith(url), 'API is called with correct URL');
            t.true(error, 'Callback is called with an error to exit current loop');
            request.get.restore();
    });
});

test('fieldviewloader.checkProductExist', function(t) {
    t.plan(2);
    sinon.stub(request, 'get').yields(null, null, '[]');
    var urls = { productData: {
                apiRoot: 'http://localhost/api',
                access_token: 1,
                productType: 'CIR'
    }};
    var url = 'http://localhost/api/images/test/products?access_token=1' +
        '&filter[where][productType]=CIR'
    var image = { id: 'test' };
    fieldviewloader.checkProductExist(urls, null, image,
        function(error, res, body) {
            t.true(request.get.calledWith(url), 'API is called with correct URL');
            t.deepEqual(body, image, 'Callback receives the image body from the previous call');
            request.get.restore();
    });
});

test('fieldviewloader.createProduct', function(t) {
    t.plan(2);
    sinon.stub(request, 'post').yields(null, null, '[{"id": 1}]');
    var urls = { productData: {
                apiRoot: 'http://localhost/api',
                access_token: 1,
                productType: 'CIR',
                productId: 'test'
    }};
    var url = 'http://localhost/api/images/test/products?access_token=1'

    fieldviewloader.createProduct(urls, null, { id: 'test' },
        function(error, res, body) {
            t.true(request.post.calledWith(url), 'API is called with correct URL');
            t.deepEqual(request.post.args[0][1],
                { json: { id: 'test', productType: 'CIR'}}, 'API is called with correct JSON');
            request.post.restore();
    });
});
