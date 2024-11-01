import { App } from 'vue'
import canvasLabel from './canvasLabel.vue'

canvasLabel.install = function(Vue: App) {
  Vue.component('canvasLabel', canvasLabel)
}

export default canvasLabel