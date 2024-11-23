<template>
  <a class="gitlog" href="https://github.com/chaikd/vue3-label" target="_blank">
      <svg height="32" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="32" data-view-component="true"
          class="octicon octicon-mark-github v-align-middle">
          <path fill-rule="evenodd"
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z">
          </path>
      </svg>
  </a>
  <div class="annotation-page">
    <div class="content-wrapper">
      <div class="annotation-area">
        <div class="card">
          <!-- <div class="card-header">
            <h2>标注区域</h2>
          </div> -->
          <div class="card">
            <div class="card-header">
              <h2>画框类型(e键结束多边形画框)</h2>
            </div>
            <div class="card-body">
              <div class="tool-grid">
                <button
                  v-for="tool in drawingTools"
                  :key="tool.name"
                  @click="selectTool(tool.name)"
                  :class="['tool-button', { active: currentTool === tool.name }]"
                >
                  <span class="icon" v-html="tool.icon"></span>
                  <!-- {{ tool.label }} -->
                </button>
              </div>
              <div class="tool-status">
                <button class="tool-button" @click="swatchRectRotate">切换矩形旋转</button>
              </div>
            </div>
          </div>
          <div class="canvas-wrapper">
            <canvasLabel
              :existingFrameInfo="state.existingFrameInfo"
              :imageUrl="state.imageUrl"
              :onlySelected="false"
            />
          </div>
        </div>
      </div>
      <div class="sidebar">
        <div class="card-body">
          <div class="card">
            <div class="card-header">
              <h2>功能按钮</h2>
            </div>
            <div class="card-body">
              <div class="action-buttons">
                <button
                  v-for="action in state.actionButtons"
                  :key="action.name"
                  @click="action.action"
                  class="action-button"
                >
                  <span class="icon" v-html="action.icon"></span>
                  <span>{{ action.label }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref,computed, reactive, onMounted } from 'vue'
import { useLabelToolService } from '../packages/services/labelToolService';

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
  imageUrl: imgArr.value[0],
  actionButtons: []
})

const drawingTools = [
  { name: 'choice', label: '选择', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>' },
  { name: 'rect', label: '矩形', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>' },
  { name: 'polygon', label: '多边形（e键结束）', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8.5 7.5L16 21H8L3.5 10.5 12 3z"/></svg>' },
  { name: 'point', label: '点', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>' },
  { name: 'brush', label: '画笔', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>' },
  { name: 'polyline', label: '折线', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3L21 21"/><path d="M3 21L21 3"/></svg>' },
]

const selectTool = (toolName) => {
  changeType(toolName)
}

const nextImage = () => {
  nextPhoto()
}

onMounted(() => {
  state.actionButtons = [
    { name: 'delete', label: '删除', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>', action: deleteFrame },
    { name: 'addLabel', label: '添加标签', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>', action: addLabel },
    { name: 'getLabelInfo', label: '获取画框信息', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>', action: getData },
    { name: 'nextImage', label: '下一张', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>', action: nextImage },
  ]
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
  toolService.deleteFrame()
}
function swatchRectRotate() {
  toolService.setConfig({
    isRectRotation: !toolService.toolStatus.isRectRotation
  })
}
</script>

<style scoped>
.gitlog {
  position: absolute;
  top: 50px;
  left: 100px;
}

.annotation-page {
  /* min-height: 100vh; */
  background-color: var(--color-gray-100);
  padding: 1rem;
}

h1 {
  font-size: 2.25rem;
  font-weight: bold;
  color: var(--color-gray-800);
  margin-bottom: 10px;
}

.content-wrapper {
  display: flex;
}

.annotation-area {
  flex: 3;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.card-header {
  background-color: var(--color-gray-50);
  border-bottom: 1px solid var(--color-gray-200);
  padding: 1rem;
}

.card-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-gray-700);
}

.card-body {
  padding: 10px;
}

.canvas-wrapper {
  height: 300px;
  border: 4px solid var(--color-gray-200);
  border-radius: 0.5rem;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1rem;
}

.tool-button, .action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s;
}

.tool-button {
  background-color: var(--color-gray-100);
  color: var(--color-gray-700);
}

.tool-button:hover {
  background-color: var(--color-gray-200);
}

.tool-button.active {
  background-color: var(--color-primary);
  color: white;
}

.action-button {
  width: 100%;
  background-color: var(--color-primary);
  color: white;
  margin-bottom: 1rem;
}

.action-button:hover {
  background-color: var(--color-primary-dark);
}

.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  margin-right: 0.5rem;
}

.icon svg {
  width: 100%;
  height: 100%;
}
.tool-status {
  margin-top: 10px;
}

@media (max-width: 1024px) {
  .content-wrapper {
    flex-direction: column;
  }

  .sidebar {
    flex-direction: row;
  }

  .card {
    flex: 1;
  }
}

@media (max-width: 768px) {
  .sidebar {
    flex-direction: column;
  }
}
</style>



