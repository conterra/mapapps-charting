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
import ct_lang from "ct/_lang";

class C3ChartsDataProvider {

    getChartData(props, attributes) {
        let res = [["x"]];

        if (props.dataSeries) {
            if (props.searchForAttributes) {
                if (props.headers) {
                    props.headers.forEach((header) => {
                        res[0].push(header || "");
                    });
                }
                props.dataSeries && props.dataSeries.forEach((series, i) => {
                    let attribute = series.attribute;
                    let title = series.title || "";
                    let header = props.header || "${time}";
                    let values = [];
                    let regex = new RegExp(attribute + "_\\d+", "gm");
                    ct_lang.forEachOwnProp(attributes, (value, name) => {
                        if (name.search(regex) >= 0) {
                            let split = name.split("_");
                            let time = parseInt(split[split.length - 1]);
                            values.push({
                                name: name,
                                title: title,
                                value: value,
                                time: time
                            });
                        }
                    });
                    values.sort((a, b) => {
                        return a.time - b.time;
                    });
                    let array = [series.title];
                    values.forEach((data) => {
                        let value = data.value;
                        if (typeof value === "undefined") {
                            value = null;
                        }
                        array.push(value);
                        if (i === 0) {
                            res[0].push(header.replace("${time}", data.time));
                        }
                    });
                    res.push(array);
                });
            } else {
                props.headers.forEach((header) => {
                    res[0].push(header || "");
                });
                props.dataSeries.forEach((series) => {
                    let array = [series.title || ""];
                    series.attributes.forEach((attribute) => {
                        let value = attributes[attribute];
                        if (typeof value === "undefined") {
                            value = null;
                        }
                        array.push(value);
                    });
                    res.push(array);
                });
            }
        } else {
            if (props.searchForAttributes) {
                let attribute = props.data.attribute;
                let title = props.data.title || "${time}";
                let values = [];
                let regex = new RegExp(attribute + "_\\d+", "gm");
                ct_lang.forEachOwnProp(attributes, (value, name) => {
                    if (name.search(regex) >= 0) {
                        let split = name.split("_");
                        let time = parseInt(split[split.length - 1]);
                        values.push({
                            name: name,
                            title: title.replace("${time}", time),
                            value: value,
                            time: time
                        });
                    }
                });
                values.sort((a, b) => {
                    return a.time - b.time;
                });
                let array = [props.title || ""];
                values.forEach((data) => {
                    res[0].push(data.title || "");
                    let value = data.value;
                    if (typeof value === "undefined") {
                        value = null;
                    }
                    array.push(value);
                });
                res.push(array);
            } else {
                let array = [props.title || ""];
                props.data.forEach((data) => {
                    res[0].push(data.title || "");
                    let value = attributes[data.attribute];
                    if (typeof value === "undefined") {
                        value = null;
                    }
                    array.push(value);
                });
                res.push(array);
            }
        }
        return res;
    }

    getDataColors(props) {
        if (props.dataSeries) {
            let colors = {};
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

module.exports = C3ChartsDataProvider;
