# Charts

The Charting Bundle allows you to display various charts based on data from an AGSSearch store.
By selecting one or more features from the selection-ui bundle, you can trigger the drawing of these charts.
You can choose of a variety of different chart types like: bar, line, spline, area and donut.

![Screenshot App](https://github.com/conterra/mapapps-charting/blob/master/screenshot.JPG)

## Sample App
https://demos.conterra.de/sandbox/resources/apps/downloads_charting/index.html

## Installation Guide
**Requirement: map.apps 4.8.0 since version 1.9.0**

[dn_charting Documentation](https://github.com/conterra/mapapps-charting/tree/master/src/main/js/bundles/dn_charting)


## Quick start

Clone this project and ensure that you have all required dependencies installed correctly (see [Documentation](https://docs.conterra.de/en/mapapps/latest/developersguide/getting-started/set-up-development-environment.html)).

Then run the following commands from the project root directory to start a local development server:

```bash
# install all required node modules
$ mvn initialize

# start dev server
$ mvn compile -Denv=dev -Pinclude-mapapps-deps

# run unit tests
$ mvn test -P run-js-tests,include-mapapps-deps
```