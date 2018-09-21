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
import d_aspect from "dojo/aspect";
import ct_util from "ct/ui/desktop/util";

export default class ChartingDashboardWidgetFactory {

    activate() {
        this._initComponent();
    }

    _initComponent() {
        let model = this._chartingDashboardWidgetModel;
        const vm = this.vm = new Vue(ChartingDashboardWidget);
        vm.i18n = this.i18n = this._i18n.get().ui;
        vm.loading = model.loading;
        vm.charts = model.charts;
        vm.activeTab = model.activeTab;

        Binding
            .create()
            .bindTo(vm, model)
            .syncAll("loading", "charts", "activeTab")
            .enable();

        vm.$once('start', () => {
            let enclosingWidget = ct_util.findEnclosingWindow(this.widget);
            if (enclosingWidget) {
                d_aspect.before(enclosingWidget, "resize", (dims) => {
                    if (dims) {
                        model.resizeCharts(dims.w);
                    }
                });
            }
        });

        vm.$on('activeTabChanged', (activeTab) => {
            model.drawGraphicsForActiveTab(activeTab);
        });

        d_aspect.after(model, "_drawCharts", () => {
            let width;
            let rect = this.vm.$el && this.vm.$el.getBoundingClientRect();
            if (rect) {
                width = rect.width
            } else {
                width = 500;
            }
            model.resizeCharts(width);
        });
    }

    createInstance() {
        this.widget = VueDijit(this.vm);
        return this.widget;
    }
}
