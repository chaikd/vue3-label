<template>
  <div class="box">
    <canvas class="canvas" ref="theCanvas" id="theCanvas"></canvas>
  </div>
</template>

<script lang="ts">
export default {
  name: 'canvasLabel'
}
</script>
<script setup lang="ts">
import { Annotator, fabricModify } from '../services/index'
import {onMounted, Reactive, reactive, ref, watch} from 'vue'
import { useLabelToolService } from '../services/labelToolService.js';
import { computed } from 'vue';
import { EditorStatus, LabelToolService } from '../services/labelToolService.type.js';
import { setLabelToolEmiter } from './setEmiter.js';

const props = defineProps({
  imageUrl: {
    type: String,
    default: ''
  },
  existingFrameInfo: {
    type:Array,
    default: () => []
  },
  onlySelected: {
    type: Boolean,
    default: false
  },
})
const state: Reactive<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  annotator?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas?: any;
  editorStatus?: EditorStatus;
}> = reactive({
  annotator: {},
  fabricCanvas: {},
})
const theCanvas = ref('theCanvas')
const toolService: LabelToolService = useLabelToolService()
setLabelToolEmiter(toolService)

const frameInfo = computed(() => {
  return toolService.editorStatus.annotator &&
  toolService.editorStatus.annotator.frameInfo?.map((v) => {
    if (props.onlySelected) {
      v._object.set({
        hasControls: false,
        lockMovementX: true,
        lockMovementY: true
      })
    }
    return v
  })
})

watch(() => props.imageUrl,(val: string) => {
  reset(val)
})
watch(() => toolService.editorStatus.toolStatus,(val: EditorStatus['toolStatus']) => {
  const { referenceLine, hideLabel, rectArea, type } = val
  if (type === 'choice') {
    toolService.editorStatus.annotator.setAllObjectsCanActive(true)
  } else {
    toolService.editorStatus.annotator.setAllObjectsCanActive(false)
  }
  toolService.editorStatus.annotator.setConfig({ referenceLine, hideLabel, rectArea, type })
  toolService.editorStatus.annotator.setCursor(val.type)
}, {
  deep: true
})
watch(() => frameInfo.value, (val) => {
  toolService.editorStatus.frameInfo = val
  toolService.editorStatus.activeFrame =
    (frameInfo.value &&
      frameInfo.value.find((v) => {
        return v._object === toolService.editorStatus.annotator.currentActiveObject
      })) ||
    {}
}, {
  deep: true,
  immediate: true
})
watch(() => props.existingFrameInfo, (val) => {
  if (Array.isArray(val) && val.length) {
    if (toolService.editorStatus.annotator && toolService.editorStatus.annotator.imgObj) {
      drawOldFrame(val)
    }
  } else {
    if (toolService.editorStatus.annotator) {
      toolService.editorStatus.annotator.clearAllFrames()
    }
  }
})

onMounted(() => {
  init()
})

const init = () => {
  getAnnotator()
  addKeyEventListener()
  // addToolService()
  toolService.editorStatus.annotator.setConfig({
    onlySelected: props.onlySelected
  })
  reset(props.imageUrl)
}
const getAnnotator = () => {
  toolService.editorStatus.annotator = new Annotator(theCanvas.value)
  state.fabricCanvas = toolService.editorStatus.annotator.fabricCanvas
}
const addBaseImg = (url: string) => {
  toolService.editorStatus.annotator.addBaseImg(url).then(() => {
    toolService.editorStatus.annotator.setZoom()
    if (props.existingFrameInfo.length) {
      drawOldFrame(props.existingFrameInfo)
    }
    if (props.onlySelected && state.editorStatus) {
      state.editorStatus.toolStatus = {
        ...state.editorStatus?.toolStatus,
        type: 'choice'
      }
    }
  })
}
const reset = (url: string) => {
  if (toolService.editorStatus.annotator) {
    toolService.editorStatus.annotator.clearCanvas()
  }
  addBaseImg(url)
}
const addKeyEventListener = () => {
  fabricModify.util.addListener(document.body, 'keydown', (e: KeyboardEvent) => {
    // if (!this.taskImage || this.isInputing) return
    // 单独设置可选中框，阻止键盘操作
    if (props.onlySelected) return
    // delete删除选中的框
    if (e.keyCode === 8) {
      if (toolService.editorStatus.annotator.currentActiveObject) {
        toolService.deleteFrame(toolService.editorStatus.annotator.currentActiveObject)
      }
    }
  })
  // fabricModify.util.addListener(document.body, 'keypress', e => {
  //   console.log(e.keyCode)
  //   // space适应画布
  //   if (e.keyCode === 32) {
  //     this.annotator.fixIn()
  //   }
  // })
  // fabricModify.util.addListener(document.body, 'keyup', () => {
  //   // if (!this.taskImage) return
  //   this.annotator.clearKeyStatus()
  // })
}
const drawOldFrame = (objs) => {
  if (toolService.editorStatus.annotator.hasActiveObject) {
    toolService.editorStatus.annotator.directiveObj(toolService.editorStatus.annotator.currentActiveObject)
  }
  toolService.editorStatus.annotator.clearAllFrames()
  objs.forEach((v: {draw_frame_type: string}) => {
    const option = parseData(v)
    toolService.editorStatus.annotator.draw(option, v.draw_frame_type)
  })
}
const parseData = (labelInfo) => {
  const coordinates = eval(labelInfo.coordinate)
  const imgObj = toolService.editorStatus.annotator.imgObj
  if (!imgObj) return
  const imgW = imgObj.width || 0,
    imgH = imgObj.height || 0,
    baseOption = {
      fill: labelInfo.fill_color || '',
      stroke: labelInfo.stroke_color || 'red',
      label: labelInfo.label_name,
      note: labelInfo.notes || '',
      frameId: labelInfo.id
    }
  const types = ['rect', 'polygon', 'point', 'brush', 'polyline']
  const draw_frame_type = types.indexOf(labelInfo.draw_frame_type) + 1 || 1
  if (draw_frame_type === 1) {
    const left = imgW * coordinates[0],
      top = imgH * coordinates[1]
    return {
      top,
      left,
      width: imgW * coordinates[2] - left,
      height: imgH * coordinates[3] - top,
      ...baseOption
    }
  }
  if (draw_frame_type === 2 || draw_frame_type === 5) {
    const points = coordinates.map(v => {
      return {
        x: v.x * imgW,
        y: v.y * imgH
      }
    })
    return {
      points,
      ...baseOption
    }
  }
  if (draw_frame_type === 3) {
    return {
      x: coordinates[0] * imgW,
      y: coordinates[1] * imgH,
      // point: {
      // },
      ...baseOption
    }
  }
  if (draw_frame_type === 4) {
    return {
      path: coordinates.map(v => {
        return v.map((value, key) => {
          if (key !== 0) {
            if (key % 2) {
              return value * imgW
            } else {
              return value * imgH
            }
          }
          return value
        })
      }),
      ...baseOption
    }
  }
}
</script>
<style scoped>
.box {
  width: 100%;
  height: 100%;
}
.lower-canvas,
.upper-canvas,
.canvas-container {
  width: 100% !important;
}
</style>