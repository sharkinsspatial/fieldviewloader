# fieldviewloader
CLI tool for loading data to Mapbox and the [fieldviewapi](https://github.com/sharkinsspatial/fieldviewapi).

Assumes Node and NPM are installed on your system.
To install the project's dependencies and development dependencies change to the project's root directory and run
````shell
$ npm install
````
Internally this application uses GDAL and several GDAL utilities.  Please ensure
that the [GDAL_DATA](https://trac.osgeo.org/gdal/wiki/FAQInstallationAndBuilding#WhatisGDAL_DATAenvironmentvariable) variable is set for your system and that the directory containing your GDAL executables is in the PATH variable.

To run tests
````shell
$ npm test
````
Before running locally the application requires several environment variables to be set for API authentication.  These can be set using
````shell
$ export MAPBOX_TOKEN=yourMapboxToken
````
````shell
$ export ADMIN_EMAIL=yourFieldViewAPIAdminEmail
````
````shell
$ export ADMIN_PASSWORD=yourFieldViewAPIAdminPassword
````
The Mapbox token should have write and read scopes as described [here](https://www.mapbox.com/help/create-api-access-token)

The application requires an instance of the [fieldviewapi](https://github.com/sharkinsspatial/fieldviewapi) running in the background for local testing.

To create shapefiles for uploading to Mapbox for Fields and Labels run
````shell
$ createMapboxShapes pathToYourMasterShapefile
````
The resulting shapefiles can be zipped and used to replace the Fields and Labels
data sources in Mapbox.

To add new fields to the FieldView API run
````shell
$ fieldloader pathToYourNewFieldsShapefile
````
To upload new images to the FieldView API and Mapbox, navigate to the images
directory and run
````shell
$ fieldviewloader
````

