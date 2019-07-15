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
import {declare} from "apprt-core/Mutable";
import ServiceResolver from "apprt/ServiceResolver";
import domConstruct from "dojo/dom-construct";
import all from "dojo/promise/all";
import ct_lang from "ct/_lang";
import Graphic from "esri/Graphic";

export default declare({

    loading: false,
    tabTitle: "",
    activeTab: "0",
    chartsTitle: "",
    charts: [],
    expandedCharts: [],
    _charts: [],
    _geometries: [],

    activate(componentContext) {
        const serviceResolver = this.serviceResolver = new ServiceResolver();
        const bundleCtx = componentContext.getBundleContext();
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
            const executions = response.executions;
            const responses = [];
            executions.forEach((response) => {
                if (response.result && response.result.length) {
                    const storeId = response.source.id;
                    const chartsProperties = this._getChartsProperties(storeId);
                    if (chartsProperties) {
                        responses.push(response);
                    }
                }
            });
            this._handleChartResponses(responses);
        });
    },

    resizeCharts(width) {
        if (width >= 40) {
            width -= 40;
        }
        this._charts.forEach((chart) => {
            chart.resize({width: width});
        });
    },

    drawGraphicsForActiveTab(activeTab) {
        const geometries = this._geometries[activeTab];
        if (geometries) {
            this._addGraphicsToView(geometries);
        }
    },

    _handleChartResponses(responses) {
        const promises = responses.map((response, i) => {
            const tabTitle = response.source.title;
            const total = response.total;
            const storeId = response.source.id;
            const chartsProperties = this._getChartsProperties(storeId);
            const chartsTitle = total === 1 ? response.result[0][chartsProperties.titleAttribute] : this._i18n.get().ui.multipleObjects;
            const chartNodes = [];
            this.charts.push({
                storeId: storeId,
                tabTitle: tabTitle,
                chartsTitle: chartsTitle,
                chartNodes: chartNodes
            });

            return this._getGeometryForResults(response.result, response.source.store).then((results) => {
                let sumObject = null;
                const geometries = [];
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

        all(promises).then(() => {
            this.loading = false;
        }, (error) => {
            console.error(error);
            this.loading = false;
        });
    },

    _getChartsProperties(storeId) {
        const chartsProperties = this._properties.chartsProperties;
        return chartsProperties.find((properties) => properties.storeId === storeId);
    },

    _drawCharts(sumObject, count, chartsProperties, chartNodes) {
        const factory = this._c3ChartsFactory;
        chartsProperties.forEach((chartProperties) => {
            const attributes = {};
            if (chartProperties.calculationType === "mean") {
                ct_lang.forEachOwnProp(sumObject, (value, name) => {
                    attributes[name] = Math.round(value / count * 100) / 100;
                });
            } else {
                ct_lang.forEachOwnProp(sumObject, (value, name) => {
                    attributes[name] = Math.round(value * 100) / 100;
                });
            }
            const chartNode = domConstruct.create("div");
            const chart = factory.createChart(chartNode, chartProperties, attributes, null);
            this._charts.push(chart);
            chartNode.titleText = chartProperties.title;
            const expanded = undefined ? true : chartProperties.expanded;
            this.expandedCharts.push(expanded);
            chartNodes.push(chartNode);
        });
    },

    _addGraphicsToView(geometries) {
        const graphics = geometries.map((geometry) => new Graphic({
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
        }));
        const view = this._mapWidgetModel.get("view");
        view.graphics.removeAll();
        view.graphics.addMany(graphics);
    },

    _getGeometryForResults(results, store) {
        const query = {
            $or: []
        };
        results.forEach((result) => {
            const obj = {};
            obj[store.idProperty] = result[store.idProperty];
            query["$or"].push(obj);
        });
        return store.query(query, {
            fields: {
                geometry: 1
            }
        }).then((results) => results);
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
