# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

在全局引入canvasLabel组件
```
// main.js
import {vueLabel, createLabelToolService} from 'vue3-label'
import 'vue3-label/style.css'

// 全局服务，用来获取当前的画框数据和一些全局监听事件
const labelToolService = createLabelToolService()
createApp(App).use(labelToolService).use(vueLabel).mount('#app')
```

在vue组件中使用
```
<canvasLabel
  :existingFrameInfo="state.existingFrameInfo"  // 画框信息，可用于回显
  :imageUrl="state.imageUrl"  // 当前图片
  :onlySelected="false"  //  是否只可选择，不能画框操作
></canvasLabel>
```

设置画布状态
```
import {useLabelToolService} from 'vue3-label'
const toolService = useLabelToolService()
//  支持的画框类型  'rect' | 'polygon' | 'point' | 'brush' | 'polyline'
toolService.editorStatus.toolStatus.type = 'ract'

// 获取画框信息
toolService.editorStatus.annotator.frameInfo

// 给当前选中画框添加标签
toolService.addLabel(<labelName>)

// 删除选中画框
toolService.deleteFrame(toolService.editorStatus.annotator.currentActiveObject)
```
