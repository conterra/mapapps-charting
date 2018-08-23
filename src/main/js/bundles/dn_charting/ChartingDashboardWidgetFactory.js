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
import ChartingDashboardWidget from "./ChartingDashboardWidget.vue";
import Vue from "apprt-vue/Vue";
import VueDijit from "apprt-vue/VueDijit";
import Binding from "apprt-binding/Binding";
import ServiceResolver from "apprt/ServiceResolver";
import domConstruct from "dojo/dom-construct";
import d_aspect from "dojo/aspect";
import ct_when from "ct/_when";
import ct_util from "ct/ui/desktop/util";
import * as WatchUtils from "esri/core/watchUtils";
import Point from "esri/geometry/Point";
import Graphic from "esri/Graphic";

export default class ChartingDashboardWidgetFactory {

    activate(componentContext) {
        let serviceResolver = this.serviceResolver = new ServiceResolver();
        let bundleCtx = componentContext.getBundleContext();
        serviceResolver.setBundleCtx(bundleCtx);
        let properties = this.properties = this._properties;
        let mapWidgetModel = this._mapWidgetModel;
        this._charts = [];

        const vm = this.vm = new Vue(ChartingDashboardWidget);
        vm.i18n = this.i18n = this._i18n.get().ui;
        vm.name = "";
        vm.chartNodes = [];

        Binding
            .create()
            .syncAll("chartNodes")
            .enable();

        vm.$once('start', () => {
            let point = new Point(properties.initialPoint);
            WatchUtils.whenDefined(mapWidgetModel, "spatialReference", (result) => {
                if (result.value) {
                    ct_when(this._coordinateTransformer.transform(point, result.value.wkid), (transformedPoint) => {
                        this._geometryDrawn({
                            geometry: transformedPoint
                        });
                    });
                }

                this._startDrawing();
            });

            let enclosingWidget = ct_util.findEnclosingWindow(this.widget);
            if (enclosingWidget) {
                d_aspect.before(enclosingWidget, "resize", (dims) => {
                    if(dims) {
                        this._resizeCharts(dims.w);
                    }
                });
            }
        });
    }

    createInstance() {
        this.widget = VueDijit(this.vm);
        return this.widget;
    }

    _startDrawing() {
        let drawing = this._drawing;
        drawing.mode = "point";
        drawing.active = true;

        let drawListener = drawing.watch("graphic", evt => {
            drawListener.remove();
            drawing.active = false;
            let point = evt.value.geometry;
            ct_when(this._coordinateTransformer.transform(point, this._mapWidgetModel.spatialReference.wkid), (transformedPoint) => {
                this._geometryDrawn({
                    geometry: transformedPoint
                });
            });
        });
    }

    _drawCharts(attributes) {
        let chartsProperties = this.properties.charts;
        let factory = this._c3ChartsFactory;
        if (this._charts.length === 0) {
            chartsProperties.forEach((chartProperties) => {
                let chartNode = domConstruct.create("div");
                let chart = factory.createChart(chartNode, chartProperties, attributes, null);
                this._charts.push(chart);
                chartNode.titleText = chartProperties.title;
                chartNode.expanded = chartProperties.expanded === undefined ? true : chartProperties.expanded;
                this.vm.chartNodes.push(chartNode);
            });
        } else {
            this._charts.forEach((chart, i) => {
                factory.createChart(null, this.properties.charts[i], attributes, chart);
            });
        }
        this._resizeCharts();
    }

    _resizeCharts(width) {
        let chartsProperties = this.properties.charts;
        let w = width || this.vm.$el.getBoundingClientRect().width;
        w -= 40;
        this._charts.forEach((chart, i) => {
            chart.resize({height: chartsProperties[i].height, width: w});
        });
    }

    _geometryDrawn(evt) {
        let geom = evt.geometry ? evt.geometry : evt.getProperty("geometry");
        try {
            let store = this._getStore(this._properties.storeId);
            ct_when(store.query({
                geometry: {
                    $intersects: geom
                }
            }, {
                fields: {
                    "geometry": true
                }
            }), (results) => {
                if (results.length > 0) {
                    let geometry = results[0].geometry;
                    this._addGraphicToView(geometry);
                    this.vm.name = results[0][this.properties.titleAttribute];
                    this._drawCharts(results[0]);
                    this._startDrawing();
                }
            }, this);
        } catch (e) {
            //do nothing
        }
    }

    _addGraphicToView(geometry) {
        let graphic = new Graphic({
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
        let view = this._mapWidgetModel.get("view");
        view.graphics.removeAll();
        view.graphics.add(graphic);
    }

    _getStore(id) {
        return this.serviceResolver.getService("ct.api.Store", "(id=" + id + ")");
    }

    _getStoreProperties(idOrStore) {
        var resolver = this.serviceResolver;
        if (typeof (idOrStore) === "string") {
            return resolver.getServiceProperties("ct.api.Store", "(id=" + idOrStore + ")");
        }
        return resolver.getServiceProperties(idOrStore);
    }
}
