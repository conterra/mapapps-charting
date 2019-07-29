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
    tabs: [],
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
        this.tabs = [];
        this._charts = [];
        this._geometries = [];
        this._tool.set("active", true);
        const queryExecutions = event.getProperty("executions");
        queryExecutions.waitForExecution().then((response) => {
            const executions = response.executions;
            const responses = [];
            executions.forEach((response) => {
                if (response.result && response.result.length) {
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
        this._charts.forEach((chart) => {
            chart.resize({width: width});
        });
    },

    drawGraphicsForActiveTab(activeTab) {
        const tab = this.tabs[activeTab];
        const geometries = tab && tab.geometries;
        if (geometries) {
            this._addGraphicsToView(geometries);
        }
    },

    _handleChartResponses(responses) {
        const properties = this._properties;
        if (properties.chartsTabs) {
            this._newChartsConfiguration(responses);
        }
        if (properties.chartsProperties) {
            this._oldChartsConfiguration(responses);
        }
    },

    _getSumObjects(responses) {
        return responses.map((response) => {
            let sumObject = null;
            const results = response.result;
            results.forEach((result) => {
                if (!sumObject) {
                    sumObject = {};
                    ct_lang.forEachOwnProp(result, (value, name) => {
                        if (typeof value === "number") {
                            sumObject[name] = parseFloat(value);
                        } else if (!sumObject[name]) {
                            sumObject[name] = value;
                        }
                    });
                } else {
                    ct_lang.forEachOwnProp(result, (value, name) => {
                        sumObject[name] = sumObject[name] += parseFloat(value);
                    });
                }
            });

            if (this._properties.drawTabGeometries) {
                return this._getGeometryForSumObject(results, response.source.store).then((results) => {
                    const geometries = [];
                    results.forEach((result) => {
                        if (result.geometry) {
                            geometries.push(result.geometry);
                        }
                    });
                    return {
                        object: sumObject,
                        count: results.length,
                        storeId: response.source.id,
                        geometries: geometries
                    };
                });
            } else {
                return Promise.resolve({
                    object: sumObject,
                    count: results.length,
                    storeId: response.source.id,
                    geometries: []
                });
            }
        });
    },

    _newChartsConfiguration(responses) {
        const properties = this._properties;
        const chartsTabs = properties.chartsTabs;
        const sumObjectsPromises = this._getSumObjects(responses);

        all(sumObjectsPromises).then((sumObjects) => {
            chartsTabs.forEach((chartsTab, i) => {
                const chartNodes = [];
                const tab = {
                    id: i,
                    tabTitle: chartsTab.title,
                    chartsTitle: this._getChartsTitle(chartsTab.chartsTitle, sumObjects),
                    chartNodes: chartNodes,
                    geometries: []
                };
                this.tabs.push(tab);
                this._drawCharts(sumObjects, chartsTab.charts, tab);
            });
            this.loading = false;
        }, (error) => {
            console.error(error);
            this.loading = false;
        });
    },

    _oldChartsConfiguration(responses) {
        const sumObjectsPromises = this._getSumObjects(responses);

        all(sumObjectsPromises).then((sumObjects) => {
            responses.forEach((response) => {
                const tabTitle = response.source.title;
                const storeId = response.source.id;
                const chartsProperties = this._getChartsProperties(storeId);
                const chartNodes = [];
                const tab = {
                    id: storeId,
                    tabTitle: tabTitle,
                    chartsTitle: this._getChartsTitle(chartsProperties.titleAttribute, response),
                    chartNodes: chartNodes,
                    geometries: []
                };
                this.tabs.push(tab);
                this._drawCharts(sumObjects, chartsProperties.charts, tab, storeId);
            });
            this.loading = false;
        }, (error) => {
            console.error(error);
            this.loading = false;
        });
    },

    _getChartsTitle(properties, objects) {
        if (properties && typeof properties === "object" && properties.constructor === Object) {
            const sumObject = objects.find((object) => object.storeId === properties.storeId);
            const count = sumObject.count;
            return count === 1 ? sumObject.object[properties.titleAttribute] : this._i18n.get().ui.multipleObjects;
        } else {
            const total = objects.total;
            return total === 1 ? objects.result[0][properties] : this._i18n.get().ui.multipleObjects;
        }
    },

    _getChartsProperties(storeId) {
        const chartsProperties = this._properties.chartsProperties;
        return chartsProperties.find((properties) => properties.storeId === storeId);
    },

    _drawCharts(sumObjects, chartsProperties, tab, storeId) {
        const factory = this._c3ChartsFactory;
        chartsProperties.forEach((chartProperties) => {
            const attributes = {};
            const sumObject = sumObjects.find((sumObject) => {
                if (chartProperties.storeId) {
                    return sumObject.storeId === chartProperties.storeId;
                } else if (storeId) {
                    return sumObject.storeId === storeId;
                }
            });
            if (!sumObject) {
                return;
            }
            tab.geometries = tab.geometries.concat(sumObject.geometries);
            if (chartProperties.calculationType === "mean") {
                ct_lang.forEachOwnProp(sumObject.object, (value, name) => {
                    if (typeof value === "number") {
                        attributes[name] = Math.round(value / sumObject.count * 100) / 100;
                    } else if (!attributes[name]) {
                        attributes[name] = value;
                    }
                });
            } else {
                ct_lang.forEachOwnProp(sumObject.object, (value, name) => {
                    if (typeof value === "number") {
                        attributes[name] = Math.round(value * 100) / 100;
                    } else if (!attributes[name]) {
                        attributes[name] = value;
                    }
                });
            }
            const chartNode = domConstruct.create("div");
            const chart = factory.createChart(chartNode, chartProperties, attributes, null);
            this._charts.push(chart);
            chartNode.titleText = chartProperties.title;
            const expanded = undefined ? true : chartProperties.expanded;
            this.expandedCharts.push(expanded);
            tab.chartNodes.push(chartNode);
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

    _getGeometryForSumObject(results, store) {
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
