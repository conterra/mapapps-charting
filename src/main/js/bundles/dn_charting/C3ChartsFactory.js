/*
 * Copyright (C) 2019 con terra GmbH (info@conterra.de)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import c3 from "c3";

export default class C3ChartsFactory {

    createChart(chartNode, chartProperties, attributes, chart) {
        return chart ? this._updateChart(chartProperties, attributes, chart) : this._createChart(chartProperties, attributes, chartNode);
    }

    _createChart(chartProperties, attributes, node) {
        const data = this._c3ChartsDataProvider.getChartData(chartProperties, attributes);
        const props = {
            bindto: node,
            padding: chartProperties.padding || {
                right: 10
            },
            data: {
                x: 'x',
                type: chartProperties.type || "bar",
                groups: chartProperties.groups || [],
                labels: chartProperties.showDataLabels === undefined ? true : chartProperties.showDataLabels
            },
            size: {
                width: chartProperties.width || 500,
                height: chartProperties.height || 500
            },
            axis: {
                rotated: chartProperties.rotatedAxis === undefined ? false : chartProperties.rotatedAxis,
                x: {
                    type: chartProperties.axisType || 'category'
                }
            }
        };
        if (chartProperties.axisFormat) {
            props.axis.x.tick = {
                format: chartProperties.axisFormat
            };
            if (chartProperties.axisTickAdjusted !== undefined) {
                props.axis.x.tick.fit = chartProperties.axisTickAdjusted;
            }
        }
        if (chartProperties.axisFormat) {
            props.data.xFormat = chartProperties.axisFormat;
        }
        if (!chartProperties.dataOrientation) {
            chartProperties.dataOrientation = "rows";
        }
        if (chartProperties.colorPattern) {
            props.color = {
                pattern: chartProperties.colorPattern
            };
        }
        const colors = this._c3ChartsDataProvider.getDataColors(chartProperties);
        if (colors) {
            props.data.colors = colors;
        }

        props.data[chartProperties.dataOrientation] = data;

        return c3.generate(props);
    }

    _updateChart(chartProperties, attributes, chart) {
        const data = this._c3ChartsDataProvider.getChartData(chartProperties, attributes);

        switch (chartProperties.dataOrientation) {
            case "columns":
                chart.load({
                    columns: data
                });
                break;
            case "rows":
                chart.load({
                    rows: data
                });
                break;
        }
    }
}
