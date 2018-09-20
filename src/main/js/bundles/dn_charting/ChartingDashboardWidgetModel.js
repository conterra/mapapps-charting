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
import {declare} from "apprt-core/Mutable";
import ServiceResolver from "apprt/ServiceResolver";
import domConstruct from "dojo/dom-construct";
import ct_lang from "ct/_lang";
import Graphic from "esri/Graphic";

export default declare({

    chartNodes: [],
    title: "",
    _charts: [],

    activate(componentContext) {
        let serviceResolver = this.serviceResolver = new ServiceResolver();
        let bundleCtx = componentContext.getBundleContext();
        serviceResolver.setBundleCtx(bundleCtx);
    },

    receiveSelections(event) {
        const queryExecutions = event.getProperty("executions");
        queryExecutions.executions[0].waitForExecution().then((response) => {
            if (this._storeId !== response.source.id) {
                this._charts = [];
                this.chartNodes = [];
            }
            let storeId = this._storeId = response.source.id;
            let chartsProperties = this._getChartsProperties(storeId);
            let total = response.total;
            this._getGeometryForResults(response.result, response.source.store).then((results) => {
                let sumObject = null;
                let geometries = [];
                results.forEach((result) => {
                    if (!sumObject) {
                        sumObject = {};
                        ct_lang.forEachOwnProp(result, (value, name) => {
                            sumObject[name] = value;
                        });
                    } else {
                        ct_lang.forEachOwnProp(result, (value, name) => {
                            sumObject[name] = sumObject[name] += value;
                        });
                    }
                    if (result.geometry) {
                        geometries.push(result.geometry);
                    }
                });
                this._addGraphicsToView(geometries);
                if (total === 1) {
                    this.title = results[0][chartsProperties.titleAttribute];
                } else {
                    this.title = this._i18n.get().ui.multipleObjects;
                }
                this._tool.set("active", true);
                this._drawCharts(sumObject, chartsProperties.charts);
            });
        });
    },

    resizeCharts(width) {
        let chartsProperties = this._getChartsProperties(this._storeId).charts;
        width -= 40;
        this._charts.forEach((chart, i) => {
            chart.resize({height: chartsProperties[i].height, width: width});
        });
    },

    _getChartsProperties(storeId) {
        let chartsProperties = this._properties.chartsProperties;
        return chartsProperties.find((properties) => {
            return properties.storeId === storeId;
        });
    },

    _drawCharts(attributes, chartsProperties) {
        let factory = this._c3ChartsFactory;
        if (this._charts.length === 0) {
            chartsProperties.forEach((chartProperties) => {
                let chartNode = domConstruct.create("div");
                let chart = factory.createChart(chartNode, chartProperties, attributes, null);
                this._charts.push(chart);
                chartNode.titleText = chartProperties.title;
                chartNode.expanded = chartProperties.expanded === undefined ? true : chartProperties.expanded;
                this.chartNodes.push(chartNode);
            });
        } else {
            this._charts.forEach((chart, i) => {
                factory.createChart(null, chartsProperties[i], attributes, chart);
            });
        }
    },

    _addGraphicsToView(geometries) {
        let graphics = geometries.map((geometry) => {
            return new Graphic({
                geometry: geometry,
                symbol: {
                    type: "simple-fill",
                    color: [51, 51, 204, 0.5],
                    style: "solid",
                    outline: {
                        color: "white",
                        width: 1
                    },
                    attributes: {}
                }
            });
        });
        let view = this._mapWidgetModel.get("view");
        view.graphics.removeAll();
        view.graphics.addMany(graphics);
    },

    _getGeometryForResults(results, store) {
        let query = {
            $or: []
        };
        results.forEach((result) => {
            let obj = {};
            obj[store.idProperty] = result[store.idProperty];
            query["$or"].push(obj);
        });
        return store.query(query, {
            fields: {
                geometry: 1
            }
        }).then((results) => {
            return results;
        });
    },

    _getStore(id) {
        return this.serviceResolver.getService("ct.api.Store", "(id=" + id + ")");
    },

    _getStoreProperties(idOrStore) {
        var resolver = this.serviceResolver;
        if (typeof (idOrStore) === "string") {
            return resolver.getServiceProperties("ct.api.Store", "(id=" + idOrStore + ")");
        }
        return resolver.getServiceProperties(idOrStore);
    }
});
