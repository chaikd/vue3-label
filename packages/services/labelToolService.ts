import { App, inject, reactive } from "vue";
import {eventBus as eventBusControl} from '../tools/eventBus.js'
import { LabelToolService as toolService } from "./labelToolService.d";

const labelToolServiceToken = '__LabelToolService__'
function createLabelToolService() {
  return new LabelToolService()
}
function useLabelToolService() {
  return (inject(labelToolServiceToken) as toolService)
}

class LabelToolService {
  eventBus
  editorStatus
  constructor() {
    this.eventBus = new eventBusControl()
    this.editorStatus = reactive({
      toolStatus: {
        referenceLine: false,
        hideLabel: null,
        rectArea: true,
        type: '',
        rotateClipStatus: {
          rotate: 0
        }
      },
      frameInfo: [],
      annotator: {},
      activeFrame: {}
    })
  }
  addLabel(labelName: string) {
    this.eventBus.$emit('addLabel', labelName)
  }
  onAddLabel(cb: (str: string | object) => void) {
    this.eventBus.$on('addLabel', cb)
  }
  rerender(obj: object) {
    this.eventBus.$emit('rerender', obj)
  }
  onRerender(cb: () => void) {
    this.eventBus.$on('rerender', cb)
  }
  deleteFrame(obj: object) {
    this.eventBus.$emit('deleteFrame', obj)
  }
  onDeleteFrame(cb: (obj: object | string) => void) {
    this.eventBus.$on('deleteFrame', cb)
  }
  setActiveObj(obj: object) {
    this.eventBus.$emit('setActiveObj', obj)
  }
  onSetActiveObj(obj: () => void) {
    this.eventBus.$on('setActiveObj', obj)
  }
  clearAllEmits() {
    this.eventBus.$clear()
  }
  install(app: App) {
    app.provide(labelToolServiceToken, this)
  }
}

export {useLabelToolService, createLabelToolService}