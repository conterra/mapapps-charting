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
        const res = [["x"]];

        if (props.dataSeries) {
            if (props.searchForAttributes) {
                // automatic search for attributes
                if (props.headers) {
                    props.headers.forEach((header) => {
                        res[0].push(header || "");
                    });
                }
                props.dataSeries && props.dataSeries.forEach((series, i) => {
                    const attribute = series.attribute;
                    const title = series.title || "";
                    const header = props.header || "${time}";
                    const values = [];
                    const regex = new RegExp(attribute + "_\\d+", "gm");
                    ct_lang.forEachOwnProp(attributes, (value, name) => {
                        if (name.search(regex) >= 0) {
                            const split = name.split("_");
                            const time = parseInt(split[split.length - 1]);
                            values.push({
                                name: name,
                                title: title,
                                value: value,
                                time: time
                            });
                        }
                    });
                    values.sort((a, b) => a.time - b.time);
                    const array = [series.title];
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
                // default data usage via configuration
                props.headers.forEach((header) => {
                    res[0].push(header || "");
                });
                props.dataSeries.forEach((series) => {
                    const array = [series.title || ""];
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
                // automatic search for attributes
                const attribute = props.data.attribute;
                const title = props.data.title || "${time}";
                const values = [];
                const regex = new RegExp(attribute + "_\\d+", "gm");
                ct_lang.forEachOwnProp(attributes, (value, name) => {
                    if (name.search(regex) >= 0) {
                        const split = name.split("_");
                        const time = parseInt(split[split.length - 1]);
                        values.push({
                            name: name,
                            title: title.replace("${time}", time),
                            value: value,
                            time: time
                        });
                    }
                });
                values.sort((a, b) => a.time - b.time);
                const array = [props.title || ""];
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
                // default data usage via configuration
                const array = [props.title || ""];
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
            const colors = {};
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
