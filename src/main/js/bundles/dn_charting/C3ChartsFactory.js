/*
 * Copyright (C) 2018 con terra GmbH (info@conterra.de)
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
        let data = this._c3ChartsDataProvider.getChartData(chartProperties, attributes);
        let props = {
            bindto: node,
            data: {
                x: 'x',
                type: chartProperties.type || "line",
                labels: chartProperties.showDataLabels === undefined ? true : chartProperties.showDataLabels
            },
            size: {
                width: chartProperties.width || 500,
                height: chartProperties.height || 500
            },
            axis: {
                rotated: chartProperties.rotatedAxis === undefined ? false : chartProperties.rotatedAxis,
                x: {
                    type: 'category'
                }
            }
        };
        if (!chartProperties.dataOrientation) {
            chartProperties.dataOrientation = "rows";
        }

        props.data[chartProperties.dataOrientation] = data;

        return c3.generate(props);
    }

    _updateChart(chartProperties, attributes, chart) {
        let data = this._c3ChartsDataProvider.getChartData(chartProperties, attributes);

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
