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

import ChartingDashboardWidget from "./ChartingDashboardWidget.ts.vue";
import Vue from "apprt-vue/Vue";
import VueDijit from "apprt-vue/VueDijit";
import Binding, { type Bindable } from "apprt-binding/Binding";
import d_aspect from "dojo/aspect";
import ct_util from "ct/ui/desktop/util";
import type { I18N } from "apprt/api";
import type ChartingDashboardController from "./ChartingDashboardController";
import type { Messages } from "./nls/bundle";
import type { ChartingDashboardWidgetModel, Tab } from "./api";

/** The Vue view model bound to the dashboard widget model. */
type ChartingDashboardVm = Vue & {
    i18n: Messages["ui"];
    loading: boolean;
    tabs: Tab[];
    expandedCharts: Array<boolean | undefined>;
    activeTab: number;
};

export default class ChartingDashboardWidgetFactory {

    declare private chartingDashboardWidgetModel: ChartingDashboardWidgetModel;
    declare private controller: ChartingDashboardController;
    declare private _i18n: I18N<Messages>;

    private vm!: ChartingDashboardVm;
    private i18n!: Messages["ui"];
    private widget!: any;

    activate(): void {
        this.initComponent();
    }

    private initComponent(): void {
        const model = this.chartingDashboardWidgetModel;
        const controller = this.controller;
        const vm = this.vm = new Vue(ChartingDashboardWidget as any) as ChartingDashboardVm;
        vm.i18n = this.i18n = this._i18n.get().ui;

        Binding
            .create()
            .bindTo(vm as unknown as Bindable, model as unknown as Bindable)
            .syncAll("activeTab")
            .syncAllToLeft("loading", "tabs", "expandedCharts")
            .enable()
            .syncToLeftNow();

        vm.$once('start', () => {
            const widget = this.widget;
            const enclosingWidget = ct_util.findEnclosingWindow(widget);
            if (enclosingWidget) {
                d_aspect.before(enclosingWidget, "resize", (dims: { w: number } | undefined) => {
                    if (dims) {
                        controller.resizeCharts(dims.w);
                    }
                });
            }
        });

        vm.$on('activeTabChanged', (activeTab: number) => {
            controller.drawGraphicsForActiveTab(activeTab);
        });

        d_aspect.after(controller, "drawCharts", () => {
            this.resizeCharts();
        });
    }

    resizeCharts(): void {
        const controller = this.controller;
        let width: number;
        const rect = this.vm.$el && this.vm.$el.getBoundingClientRect();
        if (rect) {
            width = rect.width;
        } else {
            width = 500;
        }
        controller.resizeCharts(width);
    }

    createInstance(): any {
        this.widget = VueDijit(this.vm);
        return this.widget;
    }
}
