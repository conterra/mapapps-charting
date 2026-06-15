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

import type { InjectedReference } from "apprt-core/InjectedReference";
import type { BulkActionContext, BulkButtonTableAction } from "result-api/api";
import type ChartingDashboardController from "./ChartingDashboardController";
import type { ChartResultSet, ChartStore } from "./api";

const actionId = "charting-bulk-action";

export default class ChartingBulkAction implements BulkButtonTableAction {

    readonly uiType = "button" as const;
    readonly id = actionId;
    readonly icon: string;
    readonly label: string;
    readonly tooltip: string;
    readonly priority?: number;

    declare private controller: InjectedReference<ChartingDashboardController>;

    constructor(properties: Record<string, any>) {
        this.icon = properties.icon;
        this.label = properties.label;
        this.tooltip = properties.tooltip;
        this.priority = properties.priority;
    }

    async trigger(actionContext: BulkActionContext): Promise<void> {
        const dataTable = actionContext.dataTable;
        const dataset = dataTable.dataset;

        // Chart the selected rows, or the whole table if nothing is selected.
        const selectedIds = dataTable.tableModel.getSelectedIds();
        const query = selectedIds.length ? { ids: selectedIds } : {};
        const items = await dataset.queryItems(query).toArray();

        const resultSet: ChartResultSet = {
            storeId: dataset.id,
            title: dataset.title,
            store: dataset.dataSource as ChartStore,
            result: items.map((item) => item.attributes),
            total: items.length
        };
        this.controller?.setCharts([resultSet]);
    }
}
