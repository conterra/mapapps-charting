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
import ct_when from "ct/_when";
import ServiceResolver from "apprt/ServiceResolver";

export default class ResultCenterChartingToolHandler {

    activate(componentContext) {
        const serviceResolver = this.serviceResolver = new ServiceResolver();
        const bundleCtx = componentContext.getBundleContext();
        serviceResolver.setBundleCtx(bundleCtx);
    }

    drawResultCenterCharts() {
        ct_when(this._queryData(), (result) => {
            const datasource = this._dataModel.datasource;
            const storeProperties = this._getStoreProperties(datasource.id);
            const response = {
                result: result,
                total: result.length,
                source: {
                    id: datasource.id,
                    title: storeProperties.title,
                    store: datasource
                }
            };
            const responses = [response];
            this._chartingDashboardWidgetModel.handleChartResponses(responses);
        });
    }

    _queryData() {
        const model = this._chartingDashboardWidgetModel;
        model.loading = true;
        const dataModel = this._dataModel;
        const selectedIds = dataModel.getSelected();
        if (selectedIds && selectedIds.length) {
            return dataModel.queryById(selectedIds);
        } else {
            return dataModel.query({});
        }
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
