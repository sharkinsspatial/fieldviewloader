/*eslint-disable no-console */
const test = require('tape');
const http = require('http');
const url = require('url');
const fieldloader = require('../fieldloader');
fieldloader.urlRoot = 'http://localhost:3003';
const request = require('request');
const sinon = require('sinon');
const merge = require('lodash.merge');
const featureTemplate = {
    "type": "Feature",
    "properties": {
        "id": 1,
        "farmId": 1,
        "name": "field1"
    },
    "geometry": {
        "type": "Polygon",
        "coordinates": [
            [
                [
                    -105.8203125,
                    42.293564192170095
        ],
        [
            -105.8203125,
            44.59046718130883
        ],
        [
            -100.546875,
            44.59046718130883
        ],
        [
            -100.546875,
            42.293564192170095
        ],
        [
            -105.8203125,
            42.293564192170095
        ]
        ]
        ]
    }
};

test('fieldloader.createField', function(t) {
    t.plan(5);
    var field = fieldloader.createField(featureTemplate);
    t.equal(field.id, featureTemplate.properties.id, 'ids are equal');
    t.equal(field.name, featureTemplate.properties.name, 'names are equal');
    t.equal(field.farmId, featureTemplate.properties.farmId, 'farmIds are equal');

    var feature = {};
    merge(feature, featureTemplate, { properties: { farm: 'Farm 1' }});
    field = fieldloader.createField(feature);
    t.equal(field.id, 1000001, 'When feature is a farm the id is over 1000000');
    t.equal(field.name, 'Farm 1 - Mosaic', 'When feature is a farm name includes Mosaic');
});

test('fieldloader.featureIsValid', function(t) {
    var errorReports = [];
    var isValid = fieldloader.featureIsValid(featureTemplate, errorReports);
    t.plan(10);
    t.equal(errorReports.length, 0, 'No errors reported with valid feature');
    t.true(isValid, 'Returns true with valid feature');

    var feature = {};
    merge(feature, featureTemplate, { properties: { id: null}});
    isValid = fieldloader.featureIsValid(feature, errorReports);
    t.equal(errorReports.length, 1, 'Error with undefined id');
    t.false(isValid, 'Returns false with invalid feature');

    merge(feature, featureTemplate, { properties: { id: 0}});
    errorReports = [];
    isValid = fieldloader.featureIsValid(feature, errorReports);
    t.equal(errorReports.length, 1, 'Error with id of 0');
    t.false(isValid, 'Returns false with invalid feature');

    feature = {};
    merge(feature, featureTemplate, { properties: { farm: 'Farm 1' }});
    errorReports = [];
    isValid = fieldloader.featureIsValid(feature, errorReports);
    t.equal(errorReports.length, 0, 'No errors reported with valid farm feature');
    t.true(isValid, 'Returns true with valid farm feature');

    merge(feature, featureTemplate, { properties: { farmId: null }});
    isValid = fieldloader.featureIsValid(feature, errorReports);
    t.equal(errorReports.length, 1, 'Error with undefined farmId');
    t.false(isValid, 'Returns false with invalid farm feature');

});

test('fieldloader.loadField', function(t) {
    var stub = sinon.stub(request, 'post').yields(null, { statusCode: 200 }, null);
    var callback = sinon.spy();
    var errorReports = [];
    fieldloader.loadField({}, '', errorReports, true, callback);
    t.plan(4);
    t.equal(callback.getCall(0).args.length, 0, 'Calls callback with no error');
    t.true(stub.called, 'request.post is called when farmExists is true');
    stub.reset();

    fieldloader.loadField({}, '', errorReports, false, callback);
    t.false(stub.called, 'request.post is not called when farmExists is false');
    t.equal(errorReports.length, 1, 'Farm does not exist error added');
    stub.restore();
})
