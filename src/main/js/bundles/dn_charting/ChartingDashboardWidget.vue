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
                v-for="chart in charts"
                :key="chart.storeId">
                {{ chart.tabTitle }}
            </v-tab>
            <v-tab-item
                v-for="chart in charts"
                :key="chart.storeId">
                <v-card class="fullHeight">
                    <v-card-title primary-title>
                        <h3>{{ i18n.statistics }} {{ chart.chartsTitle }}</h3>
                    </v-card-title>
                    <v-expansion-panel
                        v-model="expandedCharts"
                        expand>
                        <v-expansion-panel-content
                            v-for="chartNode in chart.chartNodes"
                            :key="chartNode.titleText">
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
        mixins: [Bindable],
        data: function () {
            return {
                loading: false,
                charts: [],
                expandedCharts: [],
                activeTab: null,
                i18n: {
                    type: Object,
                    default: function () {
                        return {}
                    }
                }
            };
        },
        components: {
            "ct-dom-node": CtDomNode
        },
        mounted: function () {
            let that = this;
            that.$nextTick(function () {
                that.$emit('start');
            })
        },
        watch: {
            activeTab: {
                handler(val, oldVal) {
                    this.$emit('activeTabChanged', val);
                }
            }
        },
        methods: {}
    };
</script>
