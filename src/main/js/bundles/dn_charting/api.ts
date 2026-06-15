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

import type Geometry from "@arcgis/core/geometry/Geometry";
import type { SelectionResult } from "selection-services/api";

/** Arbitrary feature attributes keyed by field name. */
export type FeatureAttributes = Record<string, any>;

/** A single related-data record (e.g. a time series entry). */
export interface RelatedDataEntry {
    time: number | Date;
    attributes: FeatureAttributes;
}

/** Feature attributes that may carry related (time series) data. */
export interface ChartAttributes extends FeatureAttributes {
    relatedData?: RelatedDataEntry[];
}

/** A single data point definition in the legacy chart configuration. */
export interface ChartDataDefinition {
    title: string;
    attribute: string;
}

/** A data series definition for multi-series charts. */
export interface ChartDataSeries {
    title: string;
    /** Single attribute, used for related-data driven series. */
    attribute?: string;
    /** Multiple attributes, used for non related-data series. */
    attributes?: string[];
    color?: string;
}

/** Date period filter applied to a date based x-axis. */
export interface AxisDatePeriodFilter {
    start: number | Date;
    end: number | Date;
}

/** Configuration of a single chart. */
export interface ChartProperties {
    type?: string;
    groups?: string[][];
    showDataLabels?: boolean;
    width?: number;
    height?: number;
    padding?: Record<string, number>;
    rotatedAxis?: boolean;
    axisType?: string;
    axisFormat?: string;
    axisParserFormat?: string;
    axisTickAdjusted?: boolean;
    axisTickCount?: number;
    axisIsDateObject?: boolean;
    axisDatePeriodFilter?: AxisDatePeriodFilter;
    dataOrientation?: "rows" | "columns";
    hideDecimalValues?: boolean;
    colorPattern?: string[];
    title?: string;
    /** Legacy single-object data definition. */
    data?: ChartDataDefinition[];
    /** Multi-series data definition. */
    dataSeries?: ChartDataSeries[];
    headers?: string[];
    relatedData?: boolean;
    calculationType?: "mean" | "sum" | string;
    expanded?: boolean;
    storeId?: string;
}

/** Chart data in c3 form: an array of rows or columns. */
export type ChartData = Array<Array<string | number | Date | null>>;

/** Reference to an attribute used as charts title for a specific store. */
export interface ChartsTitleReference {
    storeId: string;
    titleAttribute: string;
}

/** A charts title is either a fixed attribute name or a store reference. */
export type ChartsTitle = string | ChartsTitleReference;

/** A configured charts tab (new configuration style). */
export interface ChartsTab {
    title: string;
    chartsTitle: ChartsTitle;
    charts: ChartProperties[];
}

/** Per-store charts configuration (legacy configuration style). */
export interface StoreChartsProperties {
    storeId: string;
    titleAttribute: string;
    charts: ChartProperties[];
}

/** Relationship metadata used to query related data for a store. */
export interface Relationship {
    id?: number | string;
    relatedTableId?: number | string;
    storeId: string;
    tableUrl: string;
    foreignKey: string;
    primaryKey: string;
    timeAttribute: string;
}

/** Minimal store contract used by this bundle. */
export interface ChartStore {
    idProperty: string;
    masterStore?: ChartStore;
    query(query?: any, options?: any): Promise<any[]>;
}

export interface ChartResultSet {
    /** Id of the source store; matches relationships and per-store chart configuration. */
    storeId: string;
    /** Human readable source title (used as the tab title in the legacy configuration). */
    title: string;
    /** The queryable store the results originate from. */
    store: ChartStore;
    /** The result records. Replaced with full attribute records by `getAllAttributes`. */
    result: any[];
    /** Total number of available results. */
    total: number;
}

/** Aggregated object computed for a store from its query results. */
export interface SumObject {
    object: (FeatureAttributes & { relatedData?: RelatedDataEntry[] }) | null;
    count: number;
    storeId: string;
    geometries: Geometry[];
}

/** DOM node hosting a single chart, augmented with its title text. */
export interface ChartNode extends HTMLElement {
    titleText?: string;
}

/** A single tab in the dashboard widget. */
export interface Tab {
    id: number;
    tabTitle: string;
    chartsTitle: string;
    chartNodes: ChartNode[];
    geometries: Geometry[];
}

/** Configured component properties of the dashboard widget model. */
export interface ChartingComponentProperties {
    drawTabGeometries: boolean;
    drawChartsForSelectionResults: boolean;
    relationships: Relationship[];
    chartsProperties: StoreChartsProperties[];
    chartsTabs: ChartsTab[];
}

/**
 * apprt event envelope delivered on the `selection/EXECUTING` topic.
 * It wraps a {@link SelectionResult} (from `selection-services`); e.g.
 * `getProperty("executions")` yields the store-api `QueryExecutions` of the running selection.
 */
export interface SelectionExecutingEvent {
    getProperty<K extends keyof SelectionResult>(name: K): SelectionResult[K];
}
