var gdal = require('gdal');
var util = require('util');

function corners(filename) {
        var ds = gdal.open(filename);
        var driver = ds.driver;
        var driver_metadata = driver.getMetadata();
        if (driver_metadata['DCAP_RASTER'] !== 'YES') {
            console.error('Source file is not a raster');
            process.exit(1);
        }

        var size = ds.rasterSize;

        var geotransform = ds.geoTransform;

        var wgs84 = gdal.SpatialReference.fromEPSG(4326);
        var coord_transform = new gdal.CoordinateTransformation(ds.srs, wgs84);
        var corner_names = Object.keys(corners);
        var getWGS84Point = function(corner) {
            var pt_orig = {
                x: geotransform[0] + corner.x * geotransform[1] + corner.y * geotransform[2],
                y: geotransform[3] + corner.x * geotransform[4] + corner.y * geotransform[5]
            }
            var pt_wgs84 = coord_transform.transformPoint(pt_orig);
            return pt_wgs84;

        }
        var upperLeft = getWGS84Point({x: 0, y: 0});
        var lowerRight = getWGS84Point({x: size.x, y: size.y});
        var bounds = [[upperLeft.x, upperLeft.y],[lowerRight.x, lowerRight.y]];
        return bounds;
}
module.exports = corners;
