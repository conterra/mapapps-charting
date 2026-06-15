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

import ct_when from "apprt-core/when";
import ServiceResolver from "apprt/ServiceResolver";
import type { ComponentContext, ServiceInstance, ServiceProperties } from "apprt/api";
import type ChartingDashboardController from "./ChartingDashboardController";
import type { ChartResultSet, ChartStore } from "./api";

interface ResultCenterDataModel {
    datasource: ChartStore & { id: string; title?: string };
    getSelected(): any[] | undefined;
    queryById(ids: any[]): Promise<any[]>;
    query(query: any): Promise<any[]>;
}

export default class ResultCenterChartingToolHandler {

    declare private dataModel: ResultCenterDataModel;
    declare private controller: ChartingDashboardController | undefined;

    private serviceResolver!: ServiceResolver;

    activate(componentContext: ComponentContext): void {
        const bundleCtx = componentContext.getBundleContext();
        this.serviceResolver = new ServiceResolver({ bundleCtx });
    }

    drawResultCenterCharts(): void {
        ct_when(this.queryData(), (result: any[]) => {
            const datasource = this.dataModel.datasource;
            const storeProperties = this.getStoreProperties(datasource.id);
            const resultSet: ChartResultSet = {
                storeId: datasource.id,
                title: storeProperties!.title as string,
                store: datasource,
                result: result,
                total: result.length
            };
            this.controller?.setCharts([resultSet]);
        });
    }

    private queryData(): Promise<any[]> {
        const dataModel = this.dataModel;
        const selectedIds = dataModel.getSelected();
        if (selectedIds && selectedIds.length) {
            return dataModel.queryById(selectedIds);
        } else {
            return dataModel.query({});
        }
    }

    private getStoreProperties(idOrStore: string | ServiceInstance): ServiceProperties | undefined {
        const resolver = this.serviceResolver;
        if (typeof (idOrStore) === "string") {
            return resolver.getServiceProperties("ct.api.Store", "(id=" + idOrStore + ")");
        }
        return resolver.getServiceProperties(idOrStore);
    }

}
