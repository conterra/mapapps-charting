Charts
The map.apps charting bundle enables you to display charts for your data. 
By clicking on the map, the user can select a different features to query charts for this feature.

![Screenshot App](https://github.com/conterra/mapapps-charting/blob/master/screenshot.JPG)

Sample App
------------------
https://demos.conterra.de/mapapps/resources/apps/downloads_charting/index.html

Installation Guide
------------------
**Requirement: map.apps 4.2.0**

First you need to configure the store for which the charts should be displayed.
For more information have a look at:
https://developernetwork.conterra.de/en/documentation/mapapps/39/developers-documentation/stores

More information about how to place a widget:
https://developernetwork.conterra.de/en/documentation/mapapps/39/developers-documentation/templates

#### Configurable Components of dn_charting

##### ChartingDashboardWidgetFactory
```
"ChartingDashboardWidgetFactory": {
    "storeId": "yourStoreID",
    "titleAttribute": "NAME",
    "initialPoint": {
        "x": 7.628694,
        "y": 51.962944
    },
    "charts": [
        {
            "title": "Altersverteilung",
            "type": "donut", //donut,
            "height": 400,
            "data": [
                {
                    "attribute": "ALTER_1",
                    "title": "Unter 18 Jahren"
                },
                {
                    "attribute": "ALTER_2",
                    "title": "18 - 29 Jahre"
                },
                {
                    "attribute": "ALTER_3",
                    "title": "30 - 49 Jahre"
                },
                {
                    "attribute": "ALTER_4",
                    "title": "50 - 64 Jahre"
                },
                {
                    "attribute": "ALTER_5",
                    "title": "65 Jahre und älter"
                }
            ],
            "dataOrientation": "rows", //rows und columns    
            "showDataLabels": true,
            "rotatedAxis": false,
            "expanded": true
        },
    ]
}
```

###### Configuration
| Property                   | Type    | Possible Values                                                       | Default                     | Description                                                                                                                                                                                                              |
|----------------------------|---------|-----------------------------------------------------------------------|-----------------------------|-------------------------------------------------------------------------------------------------------------|
| storeId                    | String  |                                                                       |                             | The ID of the store for which the charts should be constructed.                                             |
| titleAttribute             | String  |                                                                       |                             | The attribute name for the title of the whole statistics section.                                           |
| initialPoint               | Array   |                                                                       |                             | Coordinate array with point of initial selected feature.                                                    |
| initialPoint.x             | Integer |                                                                       |                             | x-coordinate of initial feature.                                                                            |
| initialPoint.y             | Integer |                                                                       |                             | y-coordinate of initial feature.                                                                            |
| charts                     | Array   |                                                                       |                             | Array with charts definitions.                                                                              |
| charts.title               | String  |                                                                       |                             | Title of specific chart.                                                                                    |
| charts.type                | String  | donut, bar, pie, line, spline, step, area, gauge                      |                             | Type of chart to be displayed. For more information see: https://c3js.org/examples.html.                    |
| charts.height              | Integer |                                                                       |                             | Height of chart to be displayed. Width will be set automatically.                                           |
| charts.data                | Array   |                                                                       |                             | Data to construct the chart for.                                                                            |
| charts.data.attribute      | String  |                                                                       |                             | Attribute name of data. Multiple objects with attribute and title can be configured.                        |
| charts.data.title          | String  |                                                                       |                             | Title for the data.                                                                                         |
| dataOrientation            | String  | rows, columns                                                         |                             | Is the initial data in rows or in columns.                                                                  |
| showDataLabels             | boolean | ```true``` &#124; ```false```                                         | true                        | Show the individual data label.                                                                             |
| rotatedAxis                | boolean | ```true``` &#124; ```false```                                         | false                       | Rotate the chart axis.                                                                                      |
| expanded                   | boolean | ```true``` &#124; ```false```                                         | false                       | Chart is initially expended.                                                                                |


Development Guide
------------------
### Define the mapapps remote base
Before you can run the project you have to define the mapapps.remote.base property in the pom.xml-file:
`<mapapps.remote.base>http://%YOURSERVER%/ct-mapapps-webapp-%VERSION%</mapapps.remote.base>`

##### Other methods to to define the mapapps.remote.base property.
1. Goal parameters
`mvn install -Dmapapps.remote.base=http://%YOURSERVER%/ct-mapapps-webapp-%VERSION%`

2. Build properties
Change the mapapps.remote.base in the build.properties file and run:
`mvn install -Denv=dev -Dlocal.configfile=%ABSOLUTEPATHTOPROJECTROOT%/build.properties`
