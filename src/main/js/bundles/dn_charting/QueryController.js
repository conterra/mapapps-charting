/*
 * Copyright (C) 2023 con terra GmbH (info@conterra.de)
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
import apprt_request from "apprt-request";

export default class QueryController {

    findRelatedRecords(objectId, url, metadata) {
        const relationships = this.relationships = metadata.relationships;
        const requests = relationships.map((relationship) => {
            const relationshipId = relationship && relationship.id;
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
            return Promise.all(requests);
        } else {
            return null;
        }
    }

    getRelatedData(results, relationship) {
        return new Promise((resolve, reject) => {
            if (!relationship || !results.length) {
                resolve(results);
            } else {
                const requests = results.map((result) => apprt_request(relationship.tableUrl + "/query", {
                    query: {
                        where: relationship.foreignKey + " LIKE " + result[relationship.primaryKey],
                        outFields: "*",
                        returnGeometry: false,
                        returnCountOnly: false,
                        f: 'json'
                    },
                    handleAs: 'json'
                }).then((relatedData) => {
                    const features = [];
                    relatedData.features.forEach((feature) => {
                        const attributes = feature.attributes;
                        const time = attributes[relationship.timeAttribute];
                        features.push({time: time, attributes: attributes});
                    });
                    result.relatedData = features;
                    return result;
                }));
                Promise.all(requests).then((results) => {
                    resolve(results);
                });
            }
        });
    }

    getRelatedMetadata(url, metadata) {
        url = url.substr(0, url.lastIndexOf("/"));
        const relationships = this.relationships = metadata.relationships;
        const requests = relationships.map((relationship) => {
            const relatedTableId = relationship && relationship.relatedTableId;
            return apprt_request(url + "/" + relatedTableId, {
                query: {
                    f: 'json'
                },
                handleAs: 'json'
            });
        });
        return Promise.all(requests);
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
        const query = {};
        const ids = results.map((result) => result[store.idProperty]);
        query[store.idProperty] = {$in: ids};
        return store.query(query, {
            fields: {
                geometry: 1
            }
        });
    }
}
