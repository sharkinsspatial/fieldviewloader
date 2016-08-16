/*eslint-disable no-console */
const test = require('tape');
const corners = require('../corners');
const path = require('path');
const image = 'data/Test2_test_test_test_CIR_150629_349_4-1.tif';

test('corners', function(t) {
    t.plan(1);
    var imagePath = path.join(__dirname, image);
    var bounds = corners(imagePath);
    t.equal(bounds.length, 2);
});
