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


/**
 * Type declarations for the bundled c3 chart library (https://c3js.org/).
 *
 * The implementation is the vendored, minified `index.js`. These declarations cover the
 * subset of the c3 API that is consumed in this project plus the most common configuration
 * options. Extend them as needed when additional c3 features are used.
 */

/** A single data value understood by c3. */
export type Primitive = string | number | boolean | Date | null;

/** A row or column of data values (the first entry is usually the series/x label). */
export type PrimitiveArray = Primitive[];

/** Built-in c3 chart types (a plain string is accepted for forward compatibility). */
export type ChartType =
    | "line"
    | "spline"
    | "step"
    | "area"
    | "area-spline"
    | "area-step"
    | "bar"
    | "scatter"
    | "pie"
    | "donut"
    | "gauge"
    | (string & {});

/** Format callback for axis ticks / data labels. c3 stringifies whatever is returned. */
export type FormatFunction = (value: any, ...args: any[]) => string | number | null;

/** Padding around the chart drawing area. */
export interface Padding {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
}

/** Data configuration. */
export interface Data {
    /** Name of the column used as the x values. */
    x?: string;
    /** Parser pattern for x values provided as strings. */
    xFormat?: string;
    /** Data provided as rows (each entry is one record). */
    rows?: PrimitiveArray[];
    /** Data provided as columns (each entry is one series). */
    columns?: PrimitiveArray[];
    /** Chart type applied to every series. */
    type?: ChartType;
    /** Chart type per series, keyed by series id. */
    types?: { [series: string]: ChartType };
    /** Series ids that should be stacked together. */
    groups?: string[][];
    /** Explicit color per series, keyed by series id. */
    colors?: { [series: string]: string };
    /** Show data point labels (or configure their format). */
    labels?: boolean | { format?: FormatFunction | { [series: string]: FormatFunction } };
    /** Human readable names per series, keyed by series id. */
    names?: { [series: string]: string };
}

/** Tick configuration of an axis. */
export interface AxisTick {
    /** `d3.format` pattern or a callback used to format tick labels. */
    format?: string | FormatFunction;
    /** Fit the tick count to the data instead of rounding. */
    fit?: boolean;
    /** Number of ticks to show. */
    count?: number;
}

/** Configuration of a single axis. */
export interface Axis {
    /** Axis value type. */
    type?: "timeseries" | "category" | "indexed" | (string & {});
    tick?: AxisTick;
    show?: boolean;
    label?: string | { text?: string; position?: string };
}

/** Axes configuration. */
export interface Axes {
    /** Swap the x and y axes. */
    rotated?: boolean;
    x?: Axis;
    y?: Axis;
    y2?: Axis;
}

/** Configuration passed to {@link C3Static.generate}. */
export interface ChartConfiguration {
    /** Element (or selector) the chart is rendered into. */
    bindto?: HTMLElement | string | null;
    data: Data;
    size?: { width?: number; height?: number };
    padding?: Padding;
    axis?: Axes;
    color?: { pattern?: string[] };
    line?: { connectNull?: boolean; step?: { type?: string } };
}

/** Arguments accepted by {@link ChartAPI.load}. */
export interface LoadOptions {
    rows?: PrimitiveArray[];
    columns?: PrimitiveArray[];
    /** Series ids to remove when loading. */
    unload?: boolean | string[];
    done?: () => void;
}

/** A generated c3 chart instance. */
export interface ChartAPI {
    /** Resize the chart; without an argument the chart resizes to its container. */
    resize(size?: { width?: number; height?: number }): void;
    /** Load (or replace) chart data. */
    load(args: LoadOptions): void;
    /** Unload data from the chart. */
    unload(args?: { ids?: string | string[]; done?: () => void }): void;
    /** Flush and redraw the chart. */
    flush(): void;
    /** Destroy the chart and release its resources. */
    destroy(): void;
}

/** The c3 module entry point. */
export interface C3Static {
    /** Generate a chart from the given configuration. */
    generate(config: ChartConfiguration): ChartAPI;
    /** The c3 library version. */
    readonly version: string;
}

declare const c3: C3Static;
export default c3;
