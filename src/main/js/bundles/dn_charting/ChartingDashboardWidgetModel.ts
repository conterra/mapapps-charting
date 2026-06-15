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

import { declare } from "apprt-core/Mutable";
import domConstruct from "dojo/dom-construct";
import ct_lang from "ct/_lang";
import apprt_when from "apprt-core/when";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import type Geometry from "@arcgis/core/geometry/Geometry";
import type { Highlight, Highlighter } from "highlights/api";
import type Tool from "ct/tools/Tool";
import type { I18N } from "apprt/api";
import type { SearchSource } from "selection-services/api";
import type { ChartAPI } from "dn_charting-c3";
import type { Messages } from "./nls/bundle";
import type C3ChartsFactory from "./C3ChartsFactory";
import type QueryController from "./QueryController";
import type {
    ChartAttributes,
    ChartingComponentProperties,
    ChartProperties,
    ChartResultSet,
    ChartsTab,
    ChartsTitle,
    ChartNode,
    ChartStore,
    RelatedDataEntry,
    SelectionExecutingEvent,
    StoreChartsProperties,
    SumObject,
    Tab
} from "./api";

const _currentHighlight = Symbol("_currentHighlight");

/**
 * Public contract of the charting dashboard widget model.
 * It exposes the mutable view state, the injected references and all behaviour methods.
 */
export interface ChartingDashboardWidgetModel {
    // mutable view state
    loading: boolean;
    tabTitle: string;
    activeTab: number;
    chartsTitle: string;
    tabs: Tab[];
    expandedCharts: Array<boolean | undefined>;
    _charts: ChartAPI[];
    _geometries: Geometry[];

    // configured component properties (propertiesConstructor)
    drawTabGeometries: boolean;
    drawChartsForSelectionResults: boolean;
    chartsTabs: ChartsTab[];
    chartsProperties: StoreChartsProperties[];

    // injected references
    _properties: ChartingComponentProperties;
    _tool: Tool;
    _c3ChartsFactory: C3ChartsFactory;
    _queryController: QueryController;
    _highlighter: Highlighter;
    _i18n: I18N<Messages>;
    _mapWidgetModel?: unknown;

    // internal state
    [_currentHighlight]?: Highlight;

    activate(): void;
    receiveSelections(event: SelectionExecutingEvent): void;
    setCharts(resultSets: ChartResultSet[]): void;
    resizeCharts(width: number): void;
    drawGraphicsForActiveTab(activeTab: number): void;
    getAllAttributes(resultSets: ChartResultSet[]): Promise<ChartResultSet[]>;
    handleChartResponses(resultSets: ChartResultSet[]): void;
    _getSumObjects(resultSets: ChartResultSet[]): Array<Promise<SumObject>>;
    _newChartsConfiguration(resultSets: ChartResultSet[]): Promise<void>;
    _oldChartsConfiguration(resultSets: ChartResultSet[]): Promise<void>;
    _getChartsTitle(properties: ChartsTitle, objects: SumObject[] | ChartResultSet): string;
    _getChartsProperties(storeId: string): StoreChartsProperties | undefined;
    _drawCharts(sumObjects: SumObject[], chartsProperties: ChartProperties[], tab: Tab, storeId?: string): void;
    _highlightGeometries(geometries: Geometry[]): void;
    _clearHighlight(): void;
    _isGeometryAlreadyContained(geometry: Geometry, geometries: Geometry[]): Geometry | undefined;
}

export default declare({

    loading: false,
    tabTitle: "",
    activeTab: 0,
    chartsTitle: "",
    tabs: [],
    expandedCharts: [],
    _charts: [],
    _geometries: [],

    activate(this: ChartingDashboardWidgetModel): void {
        this._tool.watch("active", (name, oldValue, newValue) => {
            if (!newValue) {
                this._clearHighlight();
            }
        });
    },

    receiveSelections(this: ChartingDashboardWidgetModel, event: SelectionExecutingEvent): void {
        if (this.drawChartsForSelectionResults) {
            if (this.loading) {
                return;
            }
            this.loading = true;
            const queryExecutions = event.getProperty("executions");
            queryExecutions.waitForExecution().then((executions) => {
                const resultSets: ChartResultSet[] = [];
                executions.executions.forEach((execution) => {
                    const result = execution.result;
                    if (!result || !result.length) {
                        return;
                    }
                    // A selection execution's source is a selection-services SearchSource (the public
                    // store-api typing only exposes the minimal DataSource view).
                    const source = execution.source as unknown as SearchSource;
                    resultSets.push({
                        storeId: source.id,
                        title: source.title,
                        store: source.store as unknown as ChartStore,
                        result: result as unknown[],
                        total: execution.total ?? result.length
                    });
                });
                this.setCharts(resultSets);
            });
        }
    },

    setCharts(this: ChartingDashboardWidgetModel, resultSets: ChartResultSet[]): void {
        this.getAllAttributes(resultSets).then((res) => {
            this.handleChartResponses(res);
        });
    },

    resizeCharts(this: ChartingDashboardWidgetModel, width: number): void {
        if (width >= 40) {
            width -= 40;
        }
        this._charts.forEach((chart) => {
            chart.resize({ width: width });
        });
    },

    drawGraphicsForActiveTab(this: ChartingDashboardWidgetModel, activeTab: number): void {
        const tab = this.tabs[activeTab];
        const geometries = tab && tab.geometries;
        if (geometries) {
            this._highlightGeometries(geometries);
        }
    },

    getAllAttributes(this: ChartingDashboardWidgetModel, resultSets: ChartResultSet[]): Promise<ChartResultSet[]> {
        const promises = resultSets.map((resultSet) => {
            let store = resultSet.store;
            if (store.masterStore) {
                store = store.masterStore;
            }
            const idProperty = store.idProperty;
            const ids = resultSet.result.map((result) => result[idProperty]);
            const query: Record<string, unknown> = {};
            query[idProperty] = { $in: ids };
            return store.query(query).then((results) => {
                resultSet.result = results;
                return resultSet;
            });
        });
        return Promise.all(promises).then((res) => res);
    },

    handleChartResponses(this: ChartingDashboardWidgetModel, resultSets: ChartResultSet[]): void {
        this.tabs = [];
        this._charts = [];
        this._geometries = [];
        this._tool.set("active", true);
        let newPromise: Promise<void> | undefined;
        let oldPromise: Promise<void> | undefined;
        if (this.chartsTabs) {
            newPromise = this._newChartsConfiguration(resultSets);
        }
        if (this.chartsProperties) {
            oldPromise = this._oldChartsConfiguration(resultSets);
        }
        Promise.all([newPromise, oldPromise]).then(() => {
            this.activeTab = 0;
            this.drawGraphicsForActiveTab(0);
        });
    },

    _getSumObjects(this: ChartingDashboardWidgetModel, resultSets: ChartResultSet[]): Array<Promise<SumObject>> {
        return resultSets.map((resultSet) => new Promise<SumObject>((resolve) => {
            let sumObject: (Record<string, any> & { relatedData?: RelatedDataEntry[] }) | null = null;
            const results = resultSet.result;
            const storeId = resultSet.storeId;
            const relationShips = this._properties.relationships;
            const relationShip = relationShips.find((relation) => relation.storeId === storeId);
            this._queryController.getRelatedData(results, relationShip).then((relatedResults) => {
                relatedResults.forEach((result) => {
                    if (!sumObject) {
                        sumObject = {};
                    }
                    const current = sumObject;
                    ct_lang.forEachProp(result, (value: any, name: string) => {
                        if (name === "relatedData") {
                            if (!current.relatedData) {
                                current.relatedData = value;
                                return;
                            }
                            current.relatedData.forEach((data) => {
                                const newData = value.find((d: RelatedDataEntry) => d.time === data.time);
                                ct_lang.forEachProp(newData.attributes, (value2: any, name2: string) => {
                                    if (data.attributes[name2]) {
                                        if (typeof value2 === "number") {
                                            data.attributes[name2] += value2;
                                        }
                                    } else {
                                        data.attributes[name2] = value2;
                                    }
                                });
                            });
                        } else {
                            if (current[name]) {
                                if (typeof value === "number") {
                                    current[name] += value;
                                }
                            } else {
                                current[name] = value;
                            }
                        }
                    });

                });

                if (this.drawTabGeometries) {
                    // eslint-disable-next-line @stylistic/max-len
                    apprt_when(this._queryController.getGeometryForSumObject(relatedResults, resultSet.store), (geometryResults: any[]) => {
                        const geometries: Geometry[] = [];
                        geometryResults.forEach((result) => {
                            if (result.geometry) {
                                // eslint-disable-next-line @stylistic/max-len
                                const geometryAlreadyContained = this._isGeometryAlreadyContained(result.geometry, geometries);
                                !geometryAlreadyContained && geometries.push(result.geometry);
                            }
                        });
                        resolve({
                            object: sumObject,
                            count: geometryResults.length,
                            storeId: storeId,
                            geometries: geometries
                        });
                    });
                } else {
                    resolve({
                        object: sumObject,
                        count: relatedResults.length,
                        storeId: storeId,
                        geometries: []
                    });
                }
            });
        }));
    },

    _newChartsConfiguration(this: ChartingDashboardWidgetModel, resultSets: ChartResultSet[]): Promise<void> {
        const chartsTabs = this.chartsTabs;
        const sumObjectsPromises = this._getSumObjects(resultSets);

        return Promise.all(sumObjectsPromises).then((sumObjects) => {
            chartsTabs.forEach((chartsTab) => {
                const chartNodes: ChartNode[] = [];
                const tab: Tab = {
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

    _oldChartsConfiguration(this: ChartingDashboardWidgetModel, resultSets: ChartResultSet[]): Promise<void> {
        const sumObjectsPromises = this._getSumObjects(resultSets);

        return Promise.all(sumObjectsPromises).then((sumObjects) => {
            resultSets.forEach((resultSet) => {
                const tabTitle = resultSet.title;
                const storeId = resultSet.storeId;
                const chartsProperties = this._getChartsProperties(storeId);
                if (!chartsProperties) {
                    return;
                }
                const chartNodes: ChartNode[] = [];
                const tab: Tab = {
                    id: this.tabs.length,
                    tabTitle: tabTitle,
                    chartsTitle: this._getChartsTitle(chartsProperties.titleAttribute, resultSet),
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

    _getChartsTitle(
        this: ChartingDashboardWidgetModel,
        properties: ChartsTitle,
        objects: SumObject[] | ChartResultSet
    ): string {
        if (properties && typeof properties === "object" && properties.constructor === Object) {
            const sumObjects = objects as SumObject[];
            const sumObject = sumObjects.find((object) => object.storeId === properties.storeId);
            let title = "";
            if (!sumObject) {
                return title;
            }
            const count = sumObject.count;
            if (count === 1) {
                title = sumObject.object?.[properties.titleAttribute] ?? "";
                if (!title && sumObject.object?.relatedData?.length) {
                    title = sumObject.object.relatedData[0].attributes[properties.titleAttribute];
                }
            } else {
                title = this._i18n.get().ui.multipleObjects;
            }
            return title;
        } else {
            const resultSet = objects as ChartResultSet;
            const total = resultSet.total;
            return total === 1 ? resultSet.result[0][properties as string] : this._i18n.get().ui.multipleObjects;
        }
    },

    _getChartsProperties(this: ChartingDashboardWidgetModel, storeId: string): StoreChartsProperties | undefined {
        const chartsProperties = this._properties.chartsProperties;
        return chartsProperties.find((properties) => properties.storeId === storeId);
    },

    _drawCharts(
        this: ChartingDashboardWidgetModel,
        sumObjects: SumObject[],
        chartsProperties: ChartProperties[],
        tab: Tab,
        storeId?: string
    ): void {
        const factory = this._c3ChartsFactory;
        chartsProperties.forEach((chartProperties) => {
            const attributes: ChartAttributes = {};
            const sumObject = sumObjects.find((sumObject) => {
                if (chartProperties.storeId) {
                    return sumObject.storeId === chartProperties.storeId;
                } else if (storeId) {
                    return sumObject.storeId === storeId;
                }
                return false;
            });
            if (!sumObject) {
                return;
            }
            sumObject.geometries.forEach((geometry) => {
                const geometryAlreadyContained = this._isGeometryAlreadyContained(geometry, tab.geometries);
                !geometryAlreadyContained && tab.geometries.push(geometry);
            });
            if (chartProperties.calculationType === "mean") {
                ct_lang.forEachOwnProp(sumObject.object, (value: any, name: string) => {
                    if (typeof value === "number") {
                        attributes[name] = Math.round(value / sumObject.count * 100) / 100;
                    } else if (!attributes[name]) {
                        attributes[name] = value;
                    }
                });
                sumObject.object?.relatedData?.forEach((data) => {
                    ct_lang.forEachOwnProp(data.attributes, (value: any, name: string) => {
                        if (typeof value === "number") {
                            attributes[name] = Math.round(value / sumObject.count * 100) / 100;
                        } else if (!attributes[name]) {
                            attributes[name] = value;
                        }
                    });
                });
            } else {
                ct_lang.forEachOwnProp(sumObject.object, (value: any, name: string) => {
                    if (typeof value === "number") {
                        attributes[name] = Math.round(value * 100) / 100;
                    } else if (!attributes[name]) {
                        attributes[name] = value;
                    }
                });
                sumObject.object?.relatedData?.forEach((data) => {
                    ct_lang.forEachOwnProp(data.attributes, (value: any, name: string) => {
                        if (typeof value === "number") {
                            attributes[name] = Math.round(value * 100) / 100;
                        } else if (!attributes[name]) {
                            attributes[name] = value;
                        }
                    });
                });
            }
            const chartNode = domConstruct.create("div") as ChartNode;
            const chart = factory.createChart(chartNode, chartProperties, attributes, null);
            this._charts.push(chart);
            chartNode.titleText = chartProperties.title;
            const expanded = chartProperties.expanded;
            this.expandedCharts.push(expanded);
            tab.chartNodes.push(chartNode);
        });
    },

    _highlightGeometries(this: ChartingDashboardWidgetModel, geometries: Geometry[]): void {
        this._clearHighlight();
        const highlightObjects = geometries.map((geometry) => {
            return {
                geometry: geometry
            };
        });
        // Geometry is the abstract base type; the highlighter expects a concrete esri geometry union.
        this[_currentHighlight] = this._highlighter.highlight(highlightObjects as any);
    },

    _clearHighlight(this: ChartingDashboardWidgetModel): void {
        const highlight = this[_currentHighlight];
        if (highlight) {
            highlight.remove();
            this[_currentHighlight] = undefined;
        }
    },

    _isGeometryAlreadyContained(
        this: ChartingDashboardWidgetModel,
        geometry: Geometry,
        geometries: Geometry[]
    ): Geometry | undefined {
        return geometries.find((g) => {
            const distance = geometryEngine.distance(g.extent!.center, geometry.extent!.center, "meters");
            return distance === 0;
        });
    }
}) as unknown as { new (...args: any[]): ChartingDashboardWidgetModel; (...args: any[]): ChartingDashboardWidgetModel };
