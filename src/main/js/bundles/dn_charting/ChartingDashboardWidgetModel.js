/*
 * Copyright (C) 2025 con terra GmbH (info@conterra.de)
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
import ct_lang from "ct/_lang";
import apprt_when from "apprt-core/when";
import * as geometryEngine from "esri/geometry/geometryEngine";

const _currentHighlight = Symbol("_currentHighlight");

export default declare({

    loading: false,
    tabTitle: "",
    activeTab: 0,
    chartsTitle: "",
    tabs: [],
    expandedCharts: [],
    _charts: [],
    _geometries: [],

    activate() {
        this._tool.watch("active", (name, oldValue, newValue) => {
            if (!newValue) {
                this._clearHighlight();
            }
        });
    },

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
                this.setCharts(responses);
            });
        }
    },

    setCharts(responses) {
        this.getAllAttributes(responses).then((res) => {
            this.handleChartResponses(res);
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
            this._highlightGeometries(geometries);
        }
    },

    getAllAttributes(responses) {
        const promises = responses.map((response) => {
            let store = response.source.store;
            if (store.masterStore) {
                store = store.masterStore;
            }
            const ids = response.result.map((result) => result[store.idProperty]);
            const query = {};
            query[store.idProperty] = {$in: ids};
            return store.query(query).then((results) => {
                response.result = results;
                return response;
            });
        });
        return Promise.all(promises).then((res) => res);
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
        Promise.all([newPromise, oldPromise]).then(() => {
            this.activeTab = 0;
            this.drawGraphicsForActiveTab(0);
        });
    },

    _getSumObjects(responses) {
        return responses.map((response) => new Promise((resolve, reject) => {
            let sumObject = null;
            const results = response.result;
            const storeId = response.source.id;
            const relationShips = this._properties.relationships;
            const relationShip = relationShips.find((relation) => relation.storeId === storeId);
            this._queryController.getRelatedData(results, relationShip).then((results) => {
                results.forEach((result) => {
                    if (!sumObject) {
                        sumObject = {};
                    }
                    ct_lang.forEachProp(result, (value, name) => {
                        if (name === "relatedData") {
                            if (!sumObject.relatedData) {
                                sumObject.relatedData = value;
                                return;
                            }
                            sumObject.relatedData.forEach((data) => {
                                const newData = value.find((d) => d.time === data.time);
                                ct_lang.forEachProp(newData.attributes, (value, name) => {
                                    if (data.attributes[name]) {
                                        if (typeof value === "number") {
                                            data.attributes[name] = data.attributes[name] += parseFloat(value);
                                        }
                                    } else {
                                        if (typeof value === "number") {
                                            data.attributes[name] = parseFloat(value);
                                        } else {
                                            data.attributes[name] = value;
                                        }
                                    }
                                });
                            });
                        } else {
                            if (sumObject[name]) {
                                if (typeof value === "number") {
                                    sumObject[name] = sumObject[name] += parseFloat(value);
                                }
                            } else {
                                if (typeof value === "number") {
                                    sumObject[name] = parseFloat(value);
                                } else {
                                    sumObject[name] = value;
                                }
                            }
                        }
                    });

                });

                if (this.drawTabGeometries) {
                    // eslint-disable-next-line max-len
                    apprt_when(this._queryController.getGeometryForSumObject(results, response.source.store), (results) => {
                        const geometries = [];
                        results.forEach((result) => {
                            if (result.geometry) {
                                // eslint-disable-next-line max-len
                                const geometryAlreadyContained = this._isGeometryAlreadyContained(result.geometry, geometries);
                                !geometryAlreadyContained && geometries.push(result.geometry);
                            }
                        });
                        resolve({
                            object: sumObject,
                            count: results.length,
                            storeId: storeId,
                            geometries: geometries
                        });
                    });
                } else {
                    resolve({
                        object: sumObject,
                        count: results.length,
                        storeId: storeId,
                        geometries: []
                    });
                }
            });
        }));
    },

    _newChartsConfiguration(responses) {
        const chartsTabs = this.chartsTabs;
        const sumObjectsPromises = this._getSumObjects(responses);

        return Promise.all(sumObjectsPromises).then((sumObjects) => {
            chartsTabs.forEach((chartsTab) => {
                const chartNodes = [];
                const tab = {
                    id: this.tabs.length,
                    tabTitle: chartsTab.title,
                    chartsTitle: this._getChartsTitle(chartsTab.chartsTitle, sumObjects),
                    chartNodes: chartNodes,
                    geometries: []
                };
                this._drawCharts(sumObjects, chartsTab.charts, tab);
                if (chartNodes.length) {
                    this.tabs.push(tab);
                }
            });
            this.loading = false;
        }, (error) => {
            console.error(error);
            this.loading = false;
        });
    },

    _oldChartsConfiguration(responses) {
        const sumObjectsPromises = this._getSumObjects(responses);

        return Promise.all(sumObjectsPromises).then((sumObjects) => {
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
            let title = "";
            if (!sumObject) {
                return title;
            }
            const count = sumObject.count;
            if (count === 1) {
                title = sumObject.object[properties.titleAttribute];
                if (!title && sumObject.object.relatedData.length) {
                    title = sumObject.object.relatedData[0].attributes[properties.titleAttribute];
                }
            } else {
                title = this._i18n.get().ui.multipleObjects;
            }
            return title;
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
            sumObject.geometries.forEach((geometry) => {
                const geometryAlreadyContained = this._isGeometryAlreadyContained(geometry, tab.geometries);
                !geometryAlreadyContained && tab.geometries.push(geometry);
            });
            if (chartProperties.calculationType === "mean") {
                ct_lang.forEachOwnProp(sumObject.object, (value, name) => {
                    if (typeof value === "number") {
                        attributes[name] = Math.round(value / sumObject.count * 100) / 100;
                    } else if (!attributes[name]) {
                        attributes[name] = value;
                    }
                });
                sumObject.object.relatedData && sumObject.object.relatedData.forEach((data) => {
                    ct_lang.forEachOwnProp(data.attributes, (value, name) => {
                        if (typeof value === "number") {
                            attributes[name] = Math.round(value / sumObject.count * 100) / 100;
                        } else if (!attributes[name]) {
                            attributes[name] = value;
                        }
                    });
                });
            } else {
                ct_lang.forEachOwnProp(sumObject.object, (value, name) => {
                    if (typeof value === "number") {
                        attributes[name] = Math.round(value * 100) / 100;
                    } else if (!attributes[name]) {
                        attributes[name] = value;
                    }
                });
                sumObject.object.relatedData && sumObject.object.relatedData.forEach((data) => {
                    ct_lang.forEachOwnProp(data.attributes, (value, name) => {
                        if (typeof value === "number") {
                            attributes[name] = Math.round(value * 100) / 100;
                        } else if (!attributes[name]) {
                            attributes[name] = value;
                        }
                    });
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

    _highlightGeometries(geometries) {
        this._clearHighlight();
        const highlightObjects = geometries.map((geometry) => {
            return {
                geometry: geometry
            };
        });
        this[_currentHighlight] = this._highlighter.highlight(highlightObjects);
    },

    _clearHighlight() {
        if (this[_currentHighlight]) {
            this[_currentHighlight].remove();
            this[_currentHighlight] = undefined;
        }
    },

    _isGeometryAlreadyContained(geometry, geometries) {
        return geometries.find((g) => {
            const distance = geometryEngine.distance(g.extent.center, geometry.extent.center, "meters");
            return distance === 0;
        });
    }
});
