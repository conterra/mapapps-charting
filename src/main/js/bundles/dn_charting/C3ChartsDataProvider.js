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

class C3ChartsDataProvider {

    getChartData(props, attributes) {
        let res = [["x"]];

        if (props.dataSeries) {
            props.headers.forEach((header) => {
                res[0].push(header || "");
            });

            props.dataSeries.forEach((serie) => {
                let array = [serie.title || ""];
                serie.attributes.forEach((attribute) => {
                    let value = attributes[attribute];
                    if (!value) {
                        value = null;
                    }
                    array.push(value);
                });
                res.push(array);
            });
        } else {
            let array = [props.title || ""];
            props.data.forEach((data) => {
                res[0].push(data.title || "");
                let value = attributes[data.attribute];
                if (!value) {
                    value = null;
                }
                array.push(value);
            });
            res.push(array);
        }
        return res;
    }

}

module.exports = C3ChartsDataProvider;
