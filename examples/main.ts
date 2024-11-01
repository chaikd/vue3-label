import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import {vueLabel, createLabelToolService} from '../packages/index.js'
// import {vueLabel, createLabelToolService} from '../dist/vue3-label.js'
// import '../dist/style.css'

const labelToolService = createLabelToolService()
createApp(App).use(labelToolService).use(vueLabel).mount('#app')
