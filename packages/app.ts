import { App } from 'vue'
import canvasLabel from './canvasLabel'

const comment = [
  canvasLabel
]

export {
	canvasLabel
}

const install = function (App: App) {
	comment.forEach((item: {name: string}) => {
		App.component(item.name, item)
	})
}

export default install

