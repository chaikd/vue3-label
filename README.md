# Vue 3 + TypeScript + Vite

底层用到了fabricjs库

# 使用
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
  :existingFrameInfo="state.existingFrameInfo"  // 画框信息，可用于回显，需与输出信息格式保持一致
  :imageUrl="state.imageUrl"  // 当前要标注的图片
  :onlySelected="false"  //  是否只可选择，是则不能进行画框操作
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
