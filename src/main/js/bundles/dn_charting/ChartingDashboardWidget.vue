<!--

    Copyright (C) 2019 con terra GmbH (info@conterra.de)

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

            http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.

-->
<template>
    <div class="fullHeight">
        <v-progress-linear
            v-if="loading"
            :active="loading"
            :indeterminate="true"
            class="pa-0 ma-0"/>
        <v-tabs
            v-model="activeTab"
            slider-color="primary"
            class="ct-flex-container fullHeight">
            <v-tab
                v-for="tab in tabs"
                :key="tab.id">
                {{ tab.tabTitle }}
            </v-tab>
            <v-tab-item
                v-for="tab in tabs"
                :key="tab.id">
                <v-card class="fullHeight">
                    <v-card-title
                        v-if="tab.chartsTitle"
                        primary-title>
                        <h3>{{ i18n.statistics }} {{ tab.chartsTitle }}</h3>
                    </v-card-title>
                    <v-expansion-panel
                        v-model="expandedCharts"
                        expand>
                        <v-expansion-panel-content
                            v-for="(chartNode, i) in tab.chartNodes"
                            :key="i">
                            <div slot="header">{{ chartNode.titleText }}</div>
                            <v-card>
                                <ct-dom-node
                                    :node="chartNode"/>
                            </v-card>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                </v-card>
            </v-tab-item>
        </v-tabs>
    </div>
</template>
<script>
    import Bindable from "apprt-vue/mixins/Bindable";
    import CtDomNode from "apprt-vue/CtDomNode.vue";

    export default {
        components: {
            "ct-dom-node": CtDomNode
        },
        mixins: [Bindable],
        data: function () {
            return {
                loading: {
                    type: Boolean,
                    default: false
                },
                tabs: {
                    type: Array,
                    default: function () {
                        return [];
                    }
                },
                expandedCharts: {
                    type: Array,
                    default: function () {
                        return [];
                    }
                },
                activeTab: null,
                i18n: {
                    type: Object,
                    default: function () {
                        return {}
                    }
                }
            };
        },
        watch: {
            activeTab: {
                handler(val) {
                    this.$emit('activeTabChanged', val);
                }
            }
        },
        mounted: function () {
            const that = this;
            that.$nextTick(function () {
                that.$emit('start');
            })
        },
        methods: {}
    };
</script>
