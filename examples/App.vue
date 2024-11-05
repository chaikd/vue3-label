<template>
  <canvasLabel
    :existingFrameInfo="state.existingFrameInfo"
    :imageUrl="state.imageUrl"
    :onlySelected="false"
  ></canvasLabel>
  <button @click="changeType('choice')">选择</button>
  <button @click="changeType('rect')">矩形</button>
  <button @click="changeType('polygon')">多边形（按e键结束）</button>
  <button @click="changeType('point')">点</button>
  <button @click="changeType('brush')">画笔</button>
  <button @click="changeType('polyline')">折线</button>
  <button @click="deleteFrame">删除</button>
  <button @click="addLabel">添加标签</button>
  <button @click="getData">获取当前图片画框信息</button>
  <button @click="nextPhoto">下一张</button>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
// 可以局部注册
// import canvasLabel from '../packages/canvasLabel/index';
import { useLabelToolService } from '../packages/services/labelToolService';
import { ref } from 'vue';

const toolService = useLabelToolService()
const imgArr = ref([
  'http://gips3.baidu.com/it/u=3886271102,3123389489&fm=3028&app=3028&f=JPEG&fmt=auto?w=1280&h=960',
  'http://gips3.baidu.com/it/u=100751361,1567855012&fm=3028&app=3028&f=JPEG&fmt=auto?w=960&h=1280',
  'http://gips1.baidu.com/it/u=1647344915,1746921568&fm=3028&app=3028&f=JPEG&fmt=auto?w=720&h=1280',
])
let imgIndex = computed(() => {
  let index = imgArr.value.findIndex(url => url === state.imageUrl)
  return index === imgArr.value.length - 1 ? 0 : ++index
})
const state = reactive({
  existingFrameInfo: [],
  imageUrl: imgArr.value[0]
})
function changeType(type: string) {
  toolService.setType(type)
}
function getData() {
  console.log(toolService.frameInfo)
}
function addLabel() {
  toolService.addLabel('123')
}
function nextPhoto() {
  state.imageUrl = imgArr.value[imgIndex.value]
}
function deleteFrame() {
  toolService.deleteFrame(toolService.activeFrame)
}
</script>



