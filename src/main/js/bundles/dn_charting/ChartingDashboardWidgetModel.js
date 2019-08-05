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
import domConstruct from "dojo/dom-construct";
import all from "dojo/promise/all";
import ct_lang from "ct/_lang";
import ct_when from "apprt-core/when";
import Graphic from "esri/Graphic";

export default declare({

    loading: false,
    tabTitle: "",
    activeTab: 0,
    chartsTitle: "",
    tabs: [],
    expandedCharts: [],
    _charts: [],
    _geometries: [],

    receiveSelections(event) {
        if (this.drawChartsForSelectionResults) {
            if (this.loading) {
                return;
            }
            this.loading = true;
            const queryExecutions = event.getProperty("executions");
            queryExecutions.waitForExecution().then((response) => {
                const executions = response.executions;
                const responses = [];
                executions.forEach((response) => {
                    if (response.result && response.result.length) {
                        responses.push(response);
                    }
                });
                this.handleChartResponses(responses);
            });
        }
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

    handleChartResponses(responses) {
        this.tabs = [];
        this._charts = [];
        this._geometries = [];
        this._tool.set("active", true);
        let newPromise;
        let oldPromise;
        if (this.chartsTabs) {
            newPromise = this._newChartsConfiguration(responses);
        }
        if (this.chartsProperties) {
            oldPromise = this._oldChartsConfiguration(responses);
        }
        all([newPromise, oldPromise]).then(() => {
            this.activeTab = 0;
        });
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
                        if (typeof value === "number") {
                            sumObject[name] = sumObject[name] += parseFloat(value);
                        } else if (!sumObject[name]) {
                            sumObject[name] = value;
                        }
                    });
                }
            });

            if (this.drawTabGeometries) {
                return ct_when(this._getGeometryForSumObject(results, response.source.store), (results) => {
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
        const chartsTabs = this.chartsTabs;
        const sumObjectsPromises = this._getSumObjects(responses);

        return all(sumObjectsPromises).then((sumObjects) => {
            chartsTabs.forEach((chartsTab, i) => {
                const chartNodes = [];
                const tab = {
                    id: this.tabs.length,
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

        return all(sumObjectsPromises).then((sumObjects) => {
            responses.forEach((response) => {
                const tabTitle = response.source.title;
                const storeId = response.source.id;
                const chartsProperties = this._getChartsProperties(storeId);
                if (!chartsProperties) {
                    return;
                }
                const chartNodes = [];
                const tab = {
                    id: this.tabs.length,
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
            if (!sumObject) {
                return "";
            }
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
        });
    }
});
