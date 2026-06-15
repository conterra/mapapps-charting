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

import domConstruct from "dojo/dom-construct";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import type { InjectedReference } from "apprt-core/InjectedReference";
import type Geometry from "@arcgis/core/geometry/Geometry";
import type { Highlight, Highlighter } from "highlights/api";
import type Tool from "ct/tools/Tool";
import type { I18N, TopicEvent } from "apprt/api";
import type { SearchSource, SelectionResult } from "selection-services/api";
import type { ChartAPI } from "dn_charting-c3";
import type { Messages } from "./nls/bundle";
import type C3ChartsFactory from "./C3ChartsFactory";
import type QueryController from "./QueryController";
import type {
    ChartAttributes,
    ChartingDashboardWidgetModel,
    ChartProperties,
    ChartResultSet,
    ChartsTitle,
    ChartNode,
    ChartStore,
    RelatedDataEntry,
    StoreChartsProperties,
    SumObject,
    Tab
} from "./api";

const currentHighlight = Symbol("currentHighlight");

/**
 * Orchestrates the charting dashboard: handles selection events, queries attributes and related
 * data, aggregates results, draws c3 charts into the tabs of the {@link ChartingDashboardWidgetModel},
 * and highlights the corresponding geometries on the map.
 *
 * The configured properties (`relationships`, `chartsProperties`, `chartsTabs`, …) live on the
 * injected model — the model is the bundle's public configuration contract (component key
 * `ChartingDashboardWidgetModel`) — so this controller reads them via `this.model`.
 */
export default class ChartingDashboardController {

    private model: InjectedReference<ChartingDashboardWidgetModel>;
    private tool: InjectedReference<Tool>;
    private c3ChartsFactory: InjectedReference<C3ChartsFactory>;
    private queryController: InjectedReference<QueryController>;
    private highlighter: InjectedReference<Highlighter>;
    private _i18n: InjectedReference<I18N<Messages>>;

    /* The c3 chart instances currently displayed */
    private charts: ChartAPI[] = [];
    private [currentHighlight]?: Highlight;

    activate(): void {
        this.tool!.watch("active", (name, oldValue, newValue) => {
            if (!newValue) {
                this.clearHighlight();
            }
        });
    }

    async receiveSelections(event: TopicEvent): Promise<void> {
        if (this.model!.drawChartsForSelectionResults) {
            const model = this.model!;
            if (model.loading) {
                return;
            }
            model.loading = true;
            // The `selection/EXECUTING` topic carries a selection-services SelectionResult.
            const queryExecutions = event.getProperty<SelectionResult["executions"]>("executions")!;
            const executions = await queryExecutions.waitForExecution();
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
        }
    }

    async setCharts(resultSets: ChartResultSet[]): Promise<void> {
        this.model!.loading = true;
        const attributes = await this.getAllAttributes(resultSets);
        await this.handleChartResponses(attributes);
    }

    resizeCharts(width: number): void {
        if (width >= 40) {
            width -= 40;
        }
        this.charts.forEach((chart) => {
            chart.resize({ width: width });
        });
    }

    drawGraphicsForActiveTab(activeTab: number): void {
        const tab = this.model!.tabs[activeTab];
        const geometries = tab && tab.geometries;
        if (geometries) {
            this.highlightGeometries(geometries);
        }
    }

    private async getAllAttributes(resultSets: ChartResultSet[]): Promise<ChartResultSet[]> {
        const promises = resultSets.map(async (resultSet) => {
            let store = resultSet.store;
            if (store.masterStore) {
                store = store.masterStore;
            }
            const idProperty = store.idProperty;
            const ids = resultSet.result.map((result) => result[idProperty]);
            const query: Record<string, unknown> = {};
            query[idProperty] = { $in: ids };
            const results = await store.query(query);
            resultSet.result = results;
            return resultSet;
        });
        return Promise.all(promises);
    }

    private async handleChartResponses(resultSets: ChartResultSet[]): Promise<void> {
        const model = this.model!;
        model.tabs = [];
        this.charts = [];
        this.tool!.set("active", true);

        if (model.chartsTabs) {
            await this.newChartsConfiguration(resultSets);
        }
        if (model.chartsProperties) {
            await this.oldChartsConfiguration(resultSets);
        }
        model.activeTab = 0;
        this.drawGraphicsForActiveTab(0);
    }

    private getSumObjects(resultSets: ChartResultSet[]): Promise<SumObject[]> {
        return Promise.all(resultSets.map((resultSet) => this.getSumObject(resultSet)));
    }

    private async getSumObject(resultSet: ChartResultSet): Promise<SumObject> {
        const storeId = resultSet.storeId;
        const relationShip = this.model!.relationships.find((relation) => relation.storeId === storeId);
        const relatedResults = await this.queryController!.getRelatedData(resultSet.result, relationShip);

        let sumObject: (Record<string, any> & { relatedData?: RelatedDataEntry[] }) | null = null;
        relatedResults.forEach((result) => {
            if (!sumObject) {
                sumObject = {};
            }
            const current = sumObject;
            for (const [name, value] of Object.entries(result)) {
                if (name === "relatedData") {
                    if (!current.relatedData) {
                        current.relatedData = value;
                        continue;
                    }
                    current.relatedData.forEach((data) => {
                        const newData = value.find((d: RelatedDataEntry) => d.time === data.time);
                        if (!newData) {
                            return;
                        }
                        for (const [name2, value2] of Object.entries(newData.attributes)) {
                            if (data.attributes[name2]) {
                                if (typeof value2 === "number") {
                                    data.attributes[name2] += value2;
                                }
                            } else {
                                data.attributes[name2] = value2;
                            }
                        }
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
            }
        });

        if (!this.model!.drawTabGeometries) {
            return { object: sumObject, count: relatedResults.length, storeId: storeId, geometries: [] };
        }

        const geometryResults: any[] =
            await this.queryController!.getGeometryForSumObject(relatedResults, resultSet.store);
        const geometries: Geometry[] = [];
        geometryResults.forEach((result) => {
            if (result.geometry) {
                const geometryAlreadyContained = this.isGeometryAlreadyContained(result.geometry, geometries);
                !geometryAlreadyContained && geometries.push(result.geometry);
            }
        });
        return { object: sumObject, count: geometryResults.length, storeId: storeId, geometries: geometries };
    }

    private async newChartsConfiguration(resultSets: ChartResultSet[]): Promise<void> {
        const model = this.model!;
        const chartsTabs = model.chartsTabs;

        try {
            const sumObjects = await this.getSumObjects(resultSets);
            chartsTabs.forEach((chartsTab) => {
                const chartNodes: ChartNode[] = [];
                const tab: Tab = {
                    id: model.tabs.length,
                    tabTitle: chartsTab.title,
                    chartsTitle: this.getChartsTitle(chartsTab.chartsTitle, sumObjects),
                    chartNodes: chartNodes,
                    geometries: []
                };
                this.drawCharts(sumObjects, chartsTab.charts, tab);
                if (chartNodes.length) {
                    model.tabs.push(tab);
                }
            });
            model.loading = false;
        } catch (error) {
            console.error(error);
            model.loading = false;
        }
    }

    private async oldChartsConfiguration(resultSets: ChartResultSet[]): Promise<void> {
        const model = this.model!;

        try {
            const sumObjects = await this.getSumObjects(resultSets);
            resultSets.forEach((resultSet) => {
                const tabTitle = resultSet.title;
                const storeId = resultSet.storeId;
                const chartsProperties = this.getChartsProperties(storeId);
                if (!chartsProperties) {
                    return;
                }
                const chartNodes: ChartNode[] = [];
                const tab: Tab = {
                    id: model.tabs.length,
                    tabTitle: tabTitle,
                    chartsTitle: this.getChartsTitle(chartsProperties.titleAttribute, resultSet),
                    chartNodes: chartNodes,
                    geometries: []
                };
                model.tabs.push(tab);
                this.drawCharts(sumObjects, chartsProperties.charts, tab, storeId);
            });
            model.loading = false;
        } catch (error) {
            console.error(error);
            model.loading = false;
        }
    }

    private getChartsTitle(properties: ChartsTitle, objects: SumObject[] | ChartResultSet): string {
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
                title = this._i18n!.get().ui.multipleObjects;
            }
            return title;
        } else {
            const resultSet = objects as ChartResultSet;
            const total = resultSet.total;
            return total === 1 ? resultSet.result[0][properties as string] : this._i18n!.get().ui.multipleObjects;
        }
    }

    private getChartsProperties(storeId: string): StoreChartsProperties | undefined {
        const chartsProperties = this.model!.chartsProperties;
        return chartsProperties.find((properties) => properties.storeId === storeId);
    }

    drawCharts(sumObjects: SumObject[], chartsProperties: ChartProperties[], tab: Tab, storeId?: string): void {
        const model = this.model!;
        const factory = this.c3ChartsFactory!;
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
                const geometryAlreadyContained = this.isGeometryAlreadyContained(geometry, tab.geometries);
                !geometryAlreadyContained && tab.geometries.push(geometry);
            });
            const object = sumObject.object;
            if (chartProperties.calculationType === "mean") {
                if (object) {
                    for (const [name, value] of Object.entries(object)) {
                        if (typeof value === "number") {
                            attributes[name] = Math.round(value / sumObject.count * 100) / 100;
                        } else if (!attributes[name]) {
                            attributes[name] = value;
                        }
                    }
                }
                object?.relatedData?.forEach((data) => {
                    for (const [name, value] of Object.entries(data.attributes)) {
                        if (typeof value === "number") {
                            attributes[name] = Math.round(value / sumObject.count * 100) / 100;
                        } else if (!attributes[name]) {
                            attributes[name] = value;
                        }
                    }
                });
            } else {
                if (object) {
                    for (const [name, value] of Object.entries(object)) {
                        if (typeof value === "number") {
                            attributes[name] = Math.round(value * 100) / 100;
                        } else if (!attributes[name]) {
                            attributes[name] = value;
                        }
                    }
                }
                object?.relatedData?.forEach((data) => {
                    for (const [name, value] of Object.entries(data.attributes)) {
                        if (typeof value === "number") {
                            attributes[name] = Math.round(value * 100) / 100;
                        } else if (!attributes[name]) {
                            attributes[name] = value;
                        }
                    }
                });
            }
            const chartNode = domConstruct.create("div") as ChartNode;
            const chart = factory.createChart(chartNode, chartProperties, attributes, null);
            this.charts.push(chart);
            chartNode.titleText = chartProperties.title;
            const expanded = chartProperties.expanded;
            model.expandedCharts.push(expanded);
            tab.chartNodes.push(chartNode);
        });
    }

    private highlightGeometries(geometries: Geometry[]): void {
        this.clearHighlight();
        const highlightObjects = geometries.map((geometry) => {
            return {
                geometry: geometry
            };
        });
        // Geometry is the abstract base type; the highlighter expects a concrete esri geometry union.
        this[currentHighlight] = this.highlighter!.highlight(highlightObjects as any);
    }

    private clearHighlight(): void {
        const highlight = this[currentHighlight];
        if (highlight) {
            highlight.remove();
            this[currentHighlight] = undefined;
        }
    }

    private isGeometryAlreadyContained(geometry: Geometry, geometries: Geometry[]): Geometry | undefined {
        return geometries.find((g) => {
            const distance = geometryEngine.distance(g.extent!.center, geometry.extent!.center, "meters");
            return distance === 0;
        });
    }
}
