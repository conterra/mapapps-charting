# Charts

The map.apps charting bundle enables you to display charts for your data. 
By clicking on the map, the user can select a different features to query charts for this feature. You can choose of a vairety of different charts like: line, timeseries, spline, step, donut, bar, pie, step, area, gauge. For more information see: For more information see: https://c3js.org/examples.html

![Screenshot App](https://github.com/conterra/mapapps-charting/blob/master/screenshot.JPG)

Sample App
------------------
https://demos.conterra.de/mapapps/resources/apps/downloads_charting/index.html

Installation Guide
------------------
**Requirement: map.apps 4.4.0**

1. First you need to add the bundles selection-ui and dn_charting to your app.

2. Then you need to configure one or more stores for which the charts should be displayed. This is the data source (layer with attributes) for which the charts will be created.
For more information have a look at:
https://developernetwork.conterra.de/en/documentation/mapapps/39/developers-documentation/stores

3. Finally, you need to configure your charts in the following component.

#### Configurable Components of dn_charting

##### ChartingDashboardWidgetFactory
```
"ChartingDashboardWidgetFactory": {
    "chartsProperties": [
        {
            "storeId": "yourStoreID",
            "titleAttribute": "NAME",
            "charts": [
                // configuration for single data series (available in all bundle versions)
                {
                    "title": "Altersverteilung",
                    "type": "donut",
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
                    "dataOrientation": "rows",   
                    "showDataLabels": true,
                    "rotatedAxis": false,
                    "expanded": true
                },
                // configuration for multiple data series in one chart (since version 1.3)
                {
                    "title": "Entwicklung Erststimme",
                    "type": "bar",
                    "height": 400,
                    "headers": [
                        "2013",
                        "2017"
                    ],
                    "dataSeries": [
                        {
                            "title": "CDU / CSU",
                            "attributes": [
                                "btw17_WKR_cducsu_erst13",
                                "btw17_WKR_cducsu_erst"
                            ]
                        },
                        {
                            "title": "SPD",
                            "attributes": [
                                "btw17_WKR_spd_erst13",
                                "btw17_WKR_spd_erst"
                            ]
                        },
                        {
                            "title": "Linke",
                            "attributes": [
                                "btw17_WKR_linke_erst13",
                                "btw17_WKR_linke_erst"
                            ]
                        },
                        {
                            "title": "Grüne",
                            "attributes": [
                                "btw17_WKR_gruene_erst13",
                                "btw17_WKR_gruene_erst"
                            ]
                        },
                        {
                            "title": "FDP",
                            "attributes": [
                                "btw17_WKR_fdp_erst13",
                                "btw17_WKR_fdp_erst"
                            ]
                        },
                        {
                            "title": "AFD",
                            "attributes": [
                                "btw17_WKR_afd_erst13",
                                "btw17_WKR_afd_erst"
                            ]
                        }
                    ],
                    "dataOrientation": "columns",
                    "showDataLabels": true,
                    "rotatedAxis": false,
                    "expanded": true
                }
            ]
        },
        ...
    ]
}
```

##### Chart Configuration
###### Core Properties
| Property                    | Type    | Possible Values                                                       | Default                     | Description                                                                                                                            |
|-----------------------------|---------|-----------------------------------------------------------------------|-----------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| storeId                     | String  |                                                                       |                             | The ID of the AGSSeach store which will be used as data source. (AGSSearch Store)                                                      |
| titleAttribute              | String  |                                                                       |                             | The attribute name for the title of the whole charting section.                                                                        |
| charts                      | Array   |                                                                       |                             | Array with charts definitions.                                                                                                         |

###### Chart properties
| Property                    | Type    | Possible Values                                                       | Default                     | Description                                                                                                                            |
|-----------------------------|---------|-----------------------------------------------------------------------|-----------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| chart.title                 | String  |                                                                       |                             | Title of specific chart.                                                                                                               |
| chart.type                  | String  | line, spline, step, donut, bar, pie, step, area, gauge                | bar                         | Type of chart. (More information: https://c3js.org/examples.html)                                                                      |
| chart.height                | Integer |                                                                       | 500                         | Height of the chart. Width will be set automatically.                                                                                  |
| chart.dataOrientation       | String  | ```rows``` &#124; ```columns ```                                      | row                         | Row or column oriented data.                                                                                                           |
| chart.showDataLabels        | boolean | ```true``` &#124; ```false```                                         | true                        | Show the individual data labels.                                                                                                       |
| chart.rotatedAxis           | boolean | ```true``` &#124; ```false```                                         | false                       | Rotate the chart axis.                                                                                                                 |
| chart.expanded              | boolean | ```true``` &#124; ```false```                                         | true                        | Chart expansion panel is initially expanded.                                                                                           |

###### Singe chart series configuration (available in all bundle versions)
| Property                    | Type    | Possible Values                                                       | Default                     | Description                                                                                                                            |
|-----------------------------|---------|-----------------------------------------------------------------------|-----------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| chart.data                  | Array   |                                                                       |                             | Array of data objects.                                                                                                                 |
| chart.data.title            | String  |                                                                       |                             | Title for the data.                                                                                                                    |
| chart.data.attribute        | String  |                                                                       |                             | Attribute name of the data.                                                                                                            |

###### Multiple chart series configuration (since 1.3)
| Property                    | Type    | Possible Values                                                       | Default                     | Description                                                                                                                            |
|-----------------------------|---------|-----------------------------------------------------------------------|-----------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| chart.dataSeries            | Array   |                                                                       |                             | Array of data series objects.                                                                                                          |
| chart.dataSeries.headers    | Array   |                                                                       |                             | Array of headers used for the x axis. (e.g. ["2016", 2017", "2018"])                                                                   |
| chart.dataSeries.title      | String  |                                                                       |                             | Title for the data series.                                                                                                             |
| chart.dataSeries.attributes | Array   |                                                                       |                             | Array of attributes in the data series. These must be in the same order as the headers.                                                |
| chart.dataSeries.groups     | Array   |                                                                       | []                          | Optional property that allows to use stacked charts. Array of grouped attributes. (e.g. [["2016", "2017"]])                            |

More information about how to place the charting widget:
https://developernetwork.conterra.de/en/documentation/mapapps/39/developers-documentation/templates

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
