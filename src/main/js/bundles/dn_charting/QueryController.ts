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

import { apprtFetchJson } from "apprt-fetch";
import type { ChartStore, FeatureAttributes, RelatedDataEntry, Relationship } from "./api";

/** A feature returned by an esri feature service query. */
interface EsriFeature {
    attributes: FeatureAttributes;
}

/** Response of an esri feature service query. */
interface EsriFeatureSet {
    features?: EsriFeature[];
}

export default class QueryController {

    async getRelatedData(
        results: FeatureAttributes[],
        relationship: Relationship | undefined
    ): Promise<FeatureAttributes[]> {
        if (!relationship || !results.length) {
            return results;
        }
        const requests = results.map(async (result) => {
            const keyValue = result[relationship.primaryKey];
            const whereValue = typeof keyValue === "string" ? `'${keyValue}'` : keyValue;
            const relatedData = await apprtFetchJson<EsriFeatureSet>(relationship.tableUrl + "/query", {
                query: {
                    where: relationship.foreignKey + " LIKE " + whereValue,
                    outFields: "*",
                    returnGeometry: false,
                    returnCountOnly: false,
                    f: "json"
                }
            });
            const features: RelatedDataEntry[] = (relatedData.features ?? []).map((feature) => {
                return {
                    time: feature.attributes[relationship.timeAttribute],
                    attributes: feature.attributes
                };
            });
            result.relatedData = features;
            return result;
        });
        return Promise.all(requests);
    }

    getGeometryForSumObject(results: FeatureAttributes[], store: ChartStore): Promise<any[]> {
        const query: Record<string, unknown> = {};
        const ids = results.map((result) => result[store.idProperty]);
        query[store.idProperty] = { $in: ids };
        return store.query(query, {
            fields: {
                geometry: 1
            }
        });
    }
}
