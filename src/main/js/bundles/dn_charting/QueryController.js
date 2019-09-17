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
import all from "dojo/promise/all";
import apprt_request from "apprt-request";

export default class QueryController {

    findRelatedRecords(objectId, url, metadata) {
        let relationships = this.relationships = metadata.relationships;
        let requests = relationships.map((relationship) => {
            let relationshipId = relationship && relationship.id;
            return apprt_request(url + "/queryRelatedRecords", {
                query: {
                    objectIds: [objectId],
                    relationshipId: relationshipId,
                    outFields: "*",
                    returnGeometry: true,
                    returnCountOnly: false,
                    f: 'json'
                },
                handleAs: 'json'
            });
        });
        if (requests.length > 0) {
            return all(requests);
        } else {
            return null;
        }
    }

    getRelatedData(results, url) {
        let requests = results.map((result) => {
            return apprt_request(url + "/query", {
                query: {
                    where: "orgunitID_int LIKE " + result.orgunitID,
                    outFields: "*",
                    returnGeometry: false,
                    returnCountOnly: false,
                    f: 'json'
                },
                handleAs: 'json'
            }).then((relatedData) => {
                result.relatedData = relatedData.features;
                return result;
            });
        });
        if (requests.length > 0) {
            return all(requests);
        } else {
            return null;
        }
    }

    getRelatedMetadata(url, metadata) {
        url = url.substr(0, url.lastIndexOf("/"));
        let relationships = this.relationships = metadata.relationships;
        let requests = relationships.map((relationship) => {
            let relatedTableId = relationship && relationship.relatedTableId;
            return apprt_request(url + "/" + relatedTableId, {
                query: {
                    f: 'json'
                },
                handleAs: 'json'
            });
        });
        return all(requests);
    }

    getMetadata(url) {
        return apprt_request(url, {
            query: {
                f: 'json'
            },
            handleAs: 'json'
        });
    }

    getGeometryForSumObject(results, store) {
        const query = {
            $or: []
        };
        results.forEach((result) => {
            const obj = {};
            obj[store.idProperty] = result[store.idProperty];
            query["$or"].push(obj);
        });
        return store.query(query, {
            fields: {
                geometry: 1
            }
        });
    }
}
