# Charts

The Charting Bundle allows you to display various charts based on data from an AGSSearch store.
By selecting one or more features from the selection-ui bundle, you can trigger the drawing of these charts.
You can choose of a variety of different chart types like: bar, line, spline, area and donut.

![Screenshot App](https://github.com/conterra/mapapps-charting/blob/master/screenshot.JPG)

## Sample App
https://demos.conterra.de/mapapps/resources/apps/downloads_charting/index.html

## Installation Guide
**Requirement: map.apps 4.8.0**

[dn_charting Documentation](https://github.com/conterra/mapapps-charting/tree/master/src/main/js/bundles/dn_charting)

## Development Guide
### Define the mapapps remote base
Before you can run the project you have to define the mapapps.remote.base property in the pom.xml-file:
`<mapapps.remote.base>http://%YOURSERVER%/ct-mapapps-webapp-%VERSION%</mapapps.remote.base>`

### Other methods to to define the mapapps.remote.base property.
1. Goal parameters
`mvn install -Dmapapps.remote.base=http://%YOURSERVER%/ct-mapapps-webapp-%VERSION%`

2. Build properties
Change the mapapps.remote.base in the build.properties file and run:
`mvn install -Denv=dev -Dlocal.configfile=%ABSOLUTEPATHTOPROJECTROOT%/build.properties`
