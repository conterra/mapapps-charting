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

    loading: false,
    tabTitle: "",
    activeTab: "0",
    chartsTitle: "",
    charts: [],
    _charts: [],
    _geometries: [],

    activate(componentContext) {
        let serviceResolver = this.serviceResolver = new ServiceResolver();
        let bundleCtx = componentContext.getBundleContext();
        serviceResolver.setBundleCtx(bundleCtx);
    },

    receiveSelections(event) {
        if (this.loading) {
            return;
        }
        this.loading = true;
        this.charts = [];
        this._charts = [];
        this._geometries = [];
        this._tool.set("active", true);
        const queryExecutions = event.getProperty("executions");
        queryExecutions.waitForExecution().then((response) => {
            this.loading = false;
            let executions = response.executions;
            let responses = [];
            executions.forEach((response) => {
                if (!response.result) {
                    return;
                }
                let storeId = response.source.id;
                let chartsProperties = this._getChartsProperties(storeId);
                if (chartsProperties) {
                    responses.push(response);
                }
            });
            this._handleChartResponses(responses);
        });
    },

    resizeCharts(width) {
        if (width >= 40) {
            width -= 40;
        }
        this._charts.forEach((chart, i) => {
            chart.resize({width: width});
        });
    },

    drawGraphicsForActiveTab(activeTab) {
        let geometries = this._geometries[activeTab];
        if (geometries) {
            this._addGraphicsToView(geometries);
        }
    },

    _handleChartResponses(responses) {
        responses.forEach((response, i) => {
            let tabTitle = response.source.title;
            let total = response.total;
            let storeId = response.source.id;
            let chartsProperties = this._getChartsProperties(storeId);
            let chartsTitle = total === 1 ? response.result[0][chartsProperties.titleAttribute] : this._i18n.get().ui.multipleObjects;
            let chartNodes = [];
            this.charts.push({
                storeId: storeId,
                tabTitle: tabTitle,
                chartsTitle: chartsTitle,
                chartNodes: chartNodes
            });

            this._getGeometryForResults(response.result, response.source.store).then((results) => {
                let sumObject = null;
                let geometries = [];
                results.forEach((result) => {
                    if (!sumObject) {
                        sumObject = {};
                        ct_lang.forEachOwnProp(result, (value, name) => {
                            sumObject[name] = parseFloat(value);
                        });
                    } else {
                        ct_lang.forEachOwnProp(result, (value, name) => {
                            sumObject[name] = sumObject[name] += parseFloat(value);
                        });
                    }
                    if (result.geometry) {
                        geometries.push(result.geometry);
                    }
                });
                if (i === parseInt(this.activeTab)) {
                    this._addGraphicsToView(geometries);
                }
                this._geometries[i] = geometries;
                this._drawCharts(sumObject, results.length, chartsProperties.charts, chartNodes);
            });
        });
    },

    _getChartsProperties(storeId) {
        let chartsProperties = this._properties.chartsProperties;
        return chartsProperties.find((properties) => {
            return properties.storeId === storeId;
        });
    },

    _drawCharts(sumObject, count, chartsProperties, chartNodes) {
        let factory = this._c3ChartsFactory;
        chartsProperties.forEach((chartProperties) => {
            let attributes = {};
            if (chartProperties.calculationType === "mean") {
                ct_lang.forEachOwnProp(sumObject, (value, name) => {
                    attributes[name] = Math.round(value / count * 100) / 100;
                });
            } else {
                ct_lang.forEachOwnProp(sumObject, (value, name) => {
                    attributes[name] = Math.round(value * 100) / 100;
                });
            }
            let chartNode = domConstruct.create("div");
            let chart = factory.createChart(chartNode, chartProperties, attributes, null);
            this._charts.push(chart);
            chartNode.titleText = chartProperties.title;
            chartNode.expanded = chartProperties.expanded === undefined ? true : chartProperties.expanded;
            chartNodes.push(chartNode);
        });
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
