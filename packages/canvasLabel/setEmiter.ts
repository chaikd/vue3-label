import { onMounted, onUnmounted } from "vue";
import { LabelToolService as toolService } from "../services/labelToolService.d";

export function setLabelToolEmiter(toolService: toolService) {
  const onAddLabel = (labelName: string) => {
    if (toolService?.editorStatus.annotator.hasActiveObject && labelName) {
      toolService.editorStatus.annotator.addLabel(labelName)
    }
  }
  const onRender = () => {
    toolService?.editorStatus.annotator.rerender()
  }
  const onDeleteFrame = (obj: object) => {
    toolService?.editorStatus.annotator.removeObj(obj)
    toolService?.editorStatus.annotator.rerender()
  }
  const onSetActiveObj = (obj: object) => {
    if (toolService?.editorStatus.annotator.currentActiveObject) {
      toolService.editorStatus.annotator.directiveObj(obj)
    }
    if (obj) {
      toolService?.editorStatus.annotator.setActiveObject(obj)
    }
  }
  const addEmiter = () => {
    toolService?.onAddLabel(onAddLabel)
    toolService?.onRerender(onRender)
    toolService?.onDeleteFrame(onDeleteFrame)
    toolService?.onSetActiveObj(onSetActiveObj)
  }
  onMounted(() => {
    addEmiter()
  })
  onUnmounted(() => {
    toolService?.clearAllEmits()
  })
}