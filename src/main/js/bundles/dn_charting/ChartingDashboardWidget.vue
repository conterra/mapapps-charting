<template>
    <div class="ct-flex-container ct-flex-container--column fullHeight">
        <div class="ct-flex-item ct-flex-item--no-grow ct-flex-item--no-shrink">
            <v-card class="elevation-6">
                <v-card-title class="primary title">{{i18n.statistics}} {{name}}</v-card-title>
            </v-card>
        </div>
        <div class="ct-flex-item overflowAuto">
            <v-expansion-panel  expand>
                <v-expansion-panel-content v-for="chartNode in chartNodes" v-bind:key="chartNode.titleText"
                                           v-bind:value="chartNode.expanded">
                    <div slot="header">{{chartNode.titleText}}</div>
                    <v-card>
                        <ct-dom-node v-bind:node='chartNode'></ct-dom-node>
                    </v-card>
                </v-expansion-panel-content>
            </v-expansion-panel>
        </div>
    </div>
</template>
<script>
    import Bindable from "apprt-vue/mixins/Bindable";
    import CtDomNode from "apprt-vue/CtDomNode.vue";

    export default {
        mixins: [Bindable],
        data: function () {
            return {
                charts: [],
                chartNodes: [],
                name: "",
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
            charts: function (val, oldVal) {
            }
        },
        methods: {}
    };
</script>
