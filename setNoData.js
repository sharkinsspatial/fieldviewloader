var gdal = require('gdal');

function setNoData(filename) {
    var src = gdal.open(filename);
    var width = src.rasterSize.x;
    var height = src.rasterSize.y;
    var bandCount = src.bands.count();
    var datatype = src.bands.get(1).datatype;
    src.close();
    var dataset = gdal.open(filename, 'r+', 'GTiff', width, height, bandCount, datatype);
    dataset.bands.forEach(function(band) {
        band.noDataValue = 0;
        band.flush();
    });
    dataset.flush();
    dataset.close();
}
module.exports = setNoData;
