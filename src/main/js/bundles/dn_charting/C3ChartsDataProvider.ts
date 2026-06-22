///
/// Copyright (C) 2025 con terra GmbH (info@conterra.de)
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///         http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import d_string from "dojo/string";
import type { ChartAttributes, ChartData, ChartProperties } from "./api";

export default class C3ChartsDataProvider {

    getChartData(props: ChartProperties, attributes: ChartAttributes): ChartData {
        const res: ChartData = [["x"]];

        if (props.dataSeries) {
            this.getDataSeriesChartData(props, attributes, res);
        } else {
            this.getDefaultChartData(props, attributes, res);
        }
        return res;
    }

    private getDefaultChartData(props: ChartProperties, attributes: ChartAttributes, res: ChartData): void {
        if (props.relatedData && props.headers && props.headers.length === 1) {
            const array: Array<string | number | Date | null> = [d_string.substitute(props.title, attributes) || ""];
            const relatedData = attributes.relatedData ?? [];
            const relatedDataObject = relatedData.find((r) => r.time.toString() === props.headers![0]);
            props.data?.forEach((data) => {
                res[0].push(d_string.substitute(data.title, attributes) || "");
                let value = relatedDataObject!.attributes[data.attribute];
                if (typeof value === "undefined") {
                    value = null;
                }
                array.push(value);
            });
            res.push(array);
        } else {
            const array: Array<string | number | Date | null> = [d_string.substitute(props.title, attributes) || ""];
            props.data?.forEach((data) => {
                res[0].push(d_string.substitute(data.title, attributes) || "");
                let value = attributes[data.attribute];
                if (typeof value === "undefined") {
                    value = null;
                }
                array.push(value);
            });
            res.push(array);
        }
    }

    private getDataSeriesChartData(props: ChartProperties, attributes: ChartAttributes, res: ChartData): void {
        if (props.headers) {
            props.headers.forEach((header) => {
                res[0].push(d_string.substitute(header, attributes) || "");
            });
        }
        if (props.relatedData) {
            res[0] = ["x"];
            props.dataSeries!.forEach((series, i) => {
                const array: Array<string | number | Date | null> = [d_string.substitute(series.title, attributes) || ""];
                let relatedData = attributes.relatedData ?? [];
                if (props.headers) {
                    // filter values
                    relatedData = relatedData.filter((r) => props.headers!.includes(r.time.toString()));
                }
                relatedData.sort((a, b) => Number(a.time) - Number(b.time));
                const attribute = series.attribute!;
                relatedData.forEach((data) => {
                    let value = data.attributes[attribute];
                    if (typeof value === "undefined") {
                        value = null;
                    }
                    // eslint-disable-next-line @stylistic/max-len
                    if (props.axisIsDateObject && props.axisDatePeriodFilter && !(Number(data.time) > Number(props.axisDatePeriodFilter.start) && Number(data.time) < Number(props.axisDatePeriodFilter.end))) {
                        return;
                    }
                    array.push(value);
                    if (i === 0) {
                        if (props.axisIsDateObject) {
                            res[0].push(data.time);
                        } else {
                            res[0].push(data.time.toString());
                        }
                    }
                });
                res.push(array);
            });
        } else {
            props.dataSeries!.forEach((series) => {
                const array: Array<string | number | Date | null> = [d_string.substitute(series.title, attributes) || ""];
                series.attributes!.forEach((attribute) => {
                    let value = attributes[attribute];
                    if (typeof value === "undefined") {
                        value = null;
                    }
                    array.push(value);
                });
                res.push(array);
            });
        }
    }

    getDataColors(props: ChartProperties): Record<string, string> | null {
        if (props.dataSeries) {
            const colors: Record<string, string> = {};
            props.dataSeries.forEach((series) => {
                if (series.color) {
                    colors[series.title] = series.color;
                }
            });
            return colors;
        } else {
            return null;
        }
    }

}
