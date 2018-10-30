# Charts

The Charting Bundle allows you to display various charts based on data from an AGSSearch store.
By selecting one or more features from the selection-ui bundle, you can trigger the drawing of these charts.
You can choose of a variety of different chart types like: bar, line, spline, area and donut.

![Screenshot App](https://github.com/conterra/mapapps-charting/blob/master/screenshot.JPG)

## Sample App
https://demos.conterra.de/mapapps/resources/apps/downloads_charting/index.html

## Installation Guide
**Requirement: map.apps 4.4.0**

1. First you need to add the bundles selection-ui and dn_charting to your app.
2. Then you need to configure one or more stores. These are the data basis for the diagrams. A simple store configuration might look like this:
```
"agssearch": {
    "AGSStore": [{
        "title": "Wahlkreise 2017 - Strukturdaten",
        "id": "wahlkreise_strukturdaten",
        "url": "https://services2.arcgis.com/jUpNdisbWqRpMo35/ArcGIS/rest/services/Wahlkreise_2017_mit_Strukturdaten/FeatureServer/0",
        "useIn": ["selection"],
        "filterOptions": {
            "suggestContains": true
        },
        "fetchIdProperty": true,
        "enablePagination": false
    }]
},
```
For more information on how to configure ArcGIS Search stores have a look at:
https://demos.conterra.de/mapapps/resources/jsregistry/root/agssearch/latest/README.md

3. Finally, you can configure your diagrams as described below.

### Configurable components of the dn_charting bundle
#### ChartingDashboardWidgetFactory
```
"ChartingDashboardWidgetModel": {
    "chartsProperties": [
        {
            "storeId": "yourStoreID",
            "titleAttribute": "NAME",
            "charts": [
                // configuration for single data series (available in all bundle versions)
                {
                    "title": "Altersverteilung",
                    "type": "bar",
                    "height": 400,
                    "data": [
                        {
                            "attribute": "Alter_unter_18",
                            "title": "Unter 18 Jahren"
                        },
                        {
                            "attribute": "Alter_18_24",
                            "title": "18 - 24 Jahre"
                        },
                        {
                            "attribute": "Alter_25_34",
                            "title": "25 - 34 Jahre"
                        },
                        {
                            "attribute": "Alter_35_59",
                            "title": "35 - 59 Jahre"
                        },
                        {
                            "attribute": "Alter_60_74",
                            "title": "60 - 74 Jahre"
                        },
                        {
                            "attribute": "Alter_75_und_mehr",
                            "title": "75 Jahre und älter"
                        }
                    ],
                    "colorPattern": [
                        "#1f77b4",
                        "#aec7e8",
                        "#ff7f0e",
                        "#ffbb78",
                        "#2ca02c",
                        "#98df8a"
                    ],
                    "calculationType": "mean",
                    "dataOrientation": "rows",
                    "showDataLabels": true,
                    "rotatedAxis": false,
                    "expanded": true
                }
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
                            ],
                            "color": "#000000"
                        },
                        {
                            "title": "SPD",
                            "attributes": [
                                "btw17_WKR_spd_erst13",
                                "btw17_WKR_spd_erst"
                            ],
                            "color": "#FF0000"
                        },
                        {
                            "title": "Linke",
                            "attributes": [
                                "btw17_WKR_linke_erst13",
                                "btw17_WKR_linke_erst"
                            ],
                            "color": "#A020F0"
                        },
                        {
                            "title": "Grüne",
                            "attributes": [
                                "btw17_WKR_gruene_erst13",
                                "btw17_WKR_gruene_erst"
                            ],
                            "color": "#00FF00"
                        },
                        {
                            "title": "FDP",
                            "attributes": [
                                "btw17_WKR_fdp_erst13",
                                "btw17_WKR_fdp_erst"
                            ],
                            "color": "#FFFF00"
                        },
                        {
                            "title": "AFD",
                            "attributes": [
                                "btw17_WKR_afd_erst13",
                                "btw17_WKR_afd_erst"
                            ],
                            "color": "#0000FF"
                        }
                    ],
                    "calculationType": "sum",
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

### Chart Configuration
#### Core Properties
| Property                    | Type    | Possible Values                                                       | Default                     | Description                                                                                                                            |
|-----------------------------|---------|-----------------------------------------------------------------------|-----------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| storeId                     | String  |                                                                       |                             | The ID of the AGSSeach store which will be used as data source. (AGSSearch Store)                                                      |
| titleAttribute              | String  |                                                                       |                             | The attribute name for the title of the whole charting section.                                                                        |
| charts                      | Array   |                                                                       |                             | Array with charts definitions.                                                                                                         |

#### Chart properties
| Property                    | Type    | Possible Values                                                       | Default                     | Description                                                                                                                            |
|-----------------------------|---------|-----------------------------------------------------------------------|-----------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| chart.title                 | String  |                                                                       |                             | Title of specific chart.                                                                                                               |
| chart.type                  | String  | line, spline, step, donut, bar, pie, step, area, gauge                | bar                         | Type of chart. (More information: https://c3js.org/examples.html)                                                                      |
| chart.height                | Integer |                                                                       | 500                         | Height of the chart. Width will be set automatically.                                                                                  |
| chart.calculationType       | String  | ```sum``` &#124; ```mean```                                           | sum                         | Use sum or mean values for multiple features.                                                                                          |
| chart.dataOrientation       | String  | ```rows``` &#124; ```columns ```                                      | row                         | Row or column oriented data.                                                                                                           |
| chart.showDataLabels        | boolean | ```true``` &#124; ```false```                                         | true                        | Show the individual data labels.                                                                                                       |
| chart.rotatedAxis           | boolean | ```true``` &#124; ```false```                                         | false                       | Rotate the chart axis.                                                                                                                 |
| chart.expanded              | boolean | ```true``` &#124; ```false```                                         | true                        | Chart expansion panel is initially expanded.                                                                                           |
| chart.colorPattern          | Array   |                                                                       |                             | Chart collor pattern. Array of hexadecimal colors.                                                                                     |

#### Single chart series configuration (available in all bundle versions)
| Property                    | Type    | Possible Values                                                       | Default                     | Description                                                                                                                            |
|-----------------------------|---------|-----------------------------------------------------------------------|-----------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| chart.data                  | Array   |                                                                       |                             | Array of data objects.                                                                                                                 |
| chart.data.title            | String  |                                                                       |                             | Title for the data.                                                                                                                    |
| chart.data.attribute        | String  |                                                                       |                             | Attribute name of the data.                                                                                                            |

#### Multiple chart series configuration (since 1.3)
| Property                    | Type    | Possible Values                                                       | Default                     | Description                                                                                                                            |
|-----------------------------|---------|-----------------------------------------------------------------------|-----------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| chart.dataSeries            | Array   |                                                                       |                             | Array of data series objects.                                                                                                          |
| chart.dataSeries.headers    | Array   |                                                                       |                             | Array of headers used for the x axis. (e.g. ["2016", 2017", "2018"])                                                                   |
| chart.dataSeries.title      | String  |                                                                       |                             | Title for the data series.                                                                                                             |
| chart.dataSeries.attributes | Array   |                                                                       |                             | Array of attributes in the data series. These must be in the same order as the headers.                                                |
| chart.dataSeries.groups     | Array   |                                                                       | []                          | Optional property that allows to use stacked charts. Array of grouped attributes. (e.g. [["2016", "2017"]])                            |
| chart.dataSeries.color      | Array   |                                                                       | []                          | Optional property that change the color of the attribute. (e.g. "#FF0000")                            |

More information about how to place the charting widget:
https://developernetwork.conterra.de/en/documentation/mapapps/39/developers-documentation/templates

### Chart configuration samples

#### Bar chart - single series
![Screenshot bar chart single series](https://github.com/conterra/mapapps-charting/blob/master/screenshots/bar_single.JPG)

```
{
    "title": "Erststimme",
    "type": "bar",
    "height": 400,
    "data": [
        {
            "attribute": "btw17_WKR_cducsu_erst",
            "title": "CDU / CSU"
        },
        {
            "attribute": "btw17_WKR_spd_erst",
            "title": "SPD"
        },
        {
            "attribute": "btw17_WKR_linke_erst",
            "title": "Linke"
        },
        {
            "attribute": "btw17_WKR_gruene_erst",
            "title": "Grüne"
        },
        {
            "attribute": "btw17_WKR_fdp_erst",
            "title": "FDP"
        },
        {
           "attribute": "btw17_WKR_afd_erst",
            "title": "AFD"
        }
    ],
    "colorPattern": [
        "#000000",
        "#FF0000",
        "#A020F0",
        "#00FF00",
        "#FFFF00",
        "#0000FF"
    ],
    "calculationType": "sum",
    "dataOrientation": "rows",
    "showDataLabels": true,
    "rotatedAxis": false,
    "expanded": true
}
```

#### Bar chart - multiple series
![Screenshot bar chart multiple series](https://github.com/conterra/mapapps-charting/blob/master/screenshots/bar_multiple.JPG)

```
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
            ],
            "color": "#000000"
        },
        {
            "title": "SPD",
            "attributes": [
                "btw17_WKR_spd_erst13",
                "btw17_WKR_spd_erst"
            ],
            "color": "#FF0000"
        },
        {
            "title": "Linke",
            "attributes": [
                "btw17_WKR_linke_erst13",
                "btw17_WKR_linke_erst"
            ],
            "color": "#A020F0"
        },
        {
            "title": "Grüne",
            "attributes": [
                "btw17_WKR_gruene_erst13",
                "btw17_WKR_gruene_erst"
            ],
            "color": "#00FF00"
        },
        {
            "title": "FDP",
            "attributes": [
                "btw17_WKR_fdp_erst13",
                "btw17_WKR_fdp_erst"
            ],
            "color": "#FFFF00"
        },
        {
            "title": "AFD",
            "attributes": [
                "btw17_WKR_afd_erst13",
                "btw17_WKR_afd_erst"
            ],
            "color": "#0000FF"
        }
    ],
    "calculationType": "sum",
    "dataOrientation": "columns",
    "showDataLabels": true,
    "rotatedAxis": false,
    "expanded": true
}
```

#### Stacked bar chart
![Screenshot stacked bar chart multiple series](https://github.com/conterra/mapapps-charting/blob/master/screenshots/bar_multiple_stacked.JPG)

```
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
            ],
            "color": "#000000"
        },
        {
            "title": "SPD",
            "attributes": [
                "btw17_WKR_spd_erst13",
                "btw17_WKR_spd_erst"
            ],
            "color": "#FF0000"
        },
        {
            "title": "Linke",
            "attributes": [
                "btw17_WKR_linke_erst13",
                "btw17_WKR_linke_erst"
            ],
            "color": "#A020F0"
        },
        {
            "title": "Grüne",
            "attributes": [
                "btw17_WKR_gruene_erst13",
                "btw17_WKR_gruene_erst"
            ],
            "color": "#00FF00"
        },
        {
            "title": "FDP",
            "attributes": [
                "btw17_WKR_fdp_erst13",
                "btw17_WKR_fdp_erst"
            ],
            "color": "#FFFF00"
        },
        {
            "title": "AFD",
            "attributes": [
                "btw17_WKR_afd_erst13",
                "btw17_WKR_afd_erst"
            ],
            "color": "#0000FF"
        }
    ],
    "groups": [
        [
            "CDU / CSU",
            "SPD"
        ]
    ],
    "calculationType": "sum",
    "dataOrientation": "columns",
    "showDataLabels": true,
    "rotatedAxis": false,
    "expanded": true
}
```

#### Line chart
![Screenshot line chart multiple series](https://github.com/conterra/mapapps-charting/blob/master/screenshots/line_multiple.JPG)

```
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
            ],
            "color": "#000000"
        },
        {
            "title": "SPD",
            "attributes": [
                "btw17_WKR_spd_erst13",
                "btw17_WKR_spd_erst"
            ],
            "color": "#FF0000"
        },
        {
            "title": "Linke",
            "attributes": [
                "btw17_WKR_linke_erst13",
                "btw17_WKR_linke_erst"
            ],
            "color": "#A020F0"
        },
        {
            "title": "Grüne",
            "attributes": [
                "btw17_WKR_gruene_erst13",
                "btw17_WKR_gruene_erst"
            ],
            "color": "#00FF00"
        },
        {
            "title": "FDP",
            "attributes": [
                "btw17_WKR_fdp_erst13",
                "btw17_WKR_fdp_erst"
            ],
            "color": "#FFFF00"
        },
        {
            "title": "AFD",
            "attributes": [
                "btw17_WKR_afd_erst13",
                "btw17_WKR_afd_erst"
            ],
            "color": "#0000FF"
        }
    ],
    "calculationType": "sum",
    "dataOrientation": "columns",
    "showDataLabels": true,
    "rotatedAxis": false,
    "expanded": true
}
```

#### Pie chart
![Screenshot pie chart single series](https://github.com/conterra/mapapps-charting/blob/master/screenshots/pie_single.JPG)

```
{
    "title": "Erststimme",
    "type": "pie",
    "height": 400,
    "data": [
        {
            "attribute": "btw17_WKR_cducsu_erst",
            "title": "CDU / CSU"
        },
        {
            "attribute": "btw17_WKR_spd_erst",
            "title": "SPD"
        },
        {
            "attribute": "btw17_WKR_linke_erst",
            "title": "Linke"
        },
        {
            "attribute": "btw17_WKR_gruene_erst",
            "title": "Grüne"
        },
        {
            "attribute": "btw17_WKR_fdp_erst",
            "title": "FDP"
        },
        {
           "attribute": "btw17_WKR_afd_erst",
            "title": "AFD"
        }
    ],
    "colorPattern": [
        "#000000",
        "#FF0000",
        "#A020F0",
        "#00FF00",
        "#FFFF00",
        "#0000FF"
    ],
    "calculationType": "sum",
    "dataOrientation": "rows",
    "showDataLabels": true,
    "rotatedAxis": false,
    "expanded": true
}
```

#### Donut chart
![Screenshot donut chart single series](https://github.com/conterra/mapapps-charting/blob/master/screenshots/donut_single.JPG)

```
{
    "title": "Erststimme",
    "type": "donut",
    "height": 400,
    "data": [
        {
            "attribute": "btw17_WKR_cducsu_erst",
            "title": "CDU / CSU"
        },
        {
            "attribute": "btw17_WKR_spd_erst",
            "title": "SPD"
        },
        {
            "attribute": "btw17_WKR_linke_erst",
            "title": "Linke"
        },
        {
            "attribute": "btw17_WKR_gruene_erst",
            "title": "Grüne"
        },
        {
            "attribute": "btw17_WKR_fdp_erst",
            "title": "FDP"
        },
        {
           "attribute": "btw17_WKR_afd_erst",
            "title": "AFD"
        }
    ],
    "colorPattern": [
        "#000000",
        "#FF0000",
        "#A020F0",
        "#00FF00",
        "#FFFF00",
        "#0000FF"
    ],
    "calculationType": "sum",
    "dataOrientation": "rows",
    "showDataLabels": true,
    "rotatedAxis": false,
    "expanded": true
}
```

#### Gauge chart
![Screenshot gauge chart single series](https://github.com/conterra/mapapps-charting/blob/master/screenshots/gauge_single.JPG)

```
{
    "title": "Arbeitslosenquote",
    "type": "gauge",
    "height": 400,
    "data": [
        {
            "attribute": "Arbeitslosenquote_insges",
            "title": "Arbeitslosenquote Insgesamt"
        }
    ],
    "calculationType": "mean",
    "dataOrientation": "rows",
    "showDataLabels": true,
    "rotatedAxis": false,
    "expanded": true
}
```

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
