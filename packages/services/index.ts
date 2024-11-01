/* eslint-disable @typescript-eslint/no-explicit-any */
import { fabric } from './fabricModify.js'
import { isKeyCommand } from './utils.js'

const fabricModify = fabric

class Annotator {
  private _canvasEl // 画布dom元素
  private _fabricCanvas // 画布
  private _canvasContainer // 画布dom父级元素
  private _mouseStatus // 鼠标状态
  private _keyStatus // 键盘状态
  private _drawStatus // 绘制状态
  private _toolStatus // 工具状态
  private _supportTypes // 支持的画框类型

  // 图片对象
  get _imgObj() {
    if (this._fabricCanvas) {
      const imgObj = this._fabricCanvas.getObjects()[0]
      return (imgObj && imgObj.type === 'image' && imgObj) || null
    }
    return null
  }
  // 基础画框属性
  get _baseDrawStatus() {
    return {
      fill: this._drawStatus.fill,
      stroke: this._drawStatus.stroke,
      selectable: this._toolStatus.type === 'choice'
    }
  }
  // 所有选中的对象
  get _activeObjects() {
    return this._fabricCanvas.getActiveObjects()
  }

  fabricCanvas
  // 当前选中的对象
  get currentActiveObject() {
    return this._activeObjects[0]
  }
  // 是否有选中对象
  get hasActiveObject() {
    return this._activeObjects.length > 0
  }
  // 画框信息列表
  get frameInfo() {
    return this.parseData(this._fabricCanvas.getObjects())
  }
  // 图片对象
  get imgObj() {
    return this._imgObj
  }

  // 画布的缩放比
  get currentZoom() {
    return (this._fabricCanvas && this._fabricCanvas.getZoom()) || 1
  }

  constructor(el, options?) {
    if (el) {
      this._canvasEl = el
      this._canvasContainer = el.parentNode
      this._init(el, options)
    } else {
      this._initData()
    }
  }

  _init(el, options) {
    this._initData()
    this._initCanvas(el, options)
    this._addCanvasEventListener()
  }

  // 初始化所有状态
  _initData() {
    this._mouseStatus = {
      mouseDown: false, // 鼠标按下
      mouseFrom: null, // 鼠标按下的点
      mouseTo: null, // 鼠标按下移动所在的点
      // mouseDownPointer: null,
      init() {
        this.mouseFrom = null
        this.mouseTo = null
        this.mouseDown = false
      }
    }
    this._keyStatus = {
      moveKey: 'space', // 移动图片的辅助键名
      isCommand: false
    }
    this._drawStatus = {
      isDrawing: false, // 是否在绘制中，比如多边形绘制中
      drawObj: null, // 当前绘制中的对象
      stroke: 'red', // 边框颜色
      fill: '', // 填充色
      deformationing: false, // 是否正在移动多边形或者折现的自定义点
      polyLinePoints: [], // 当前绘制已经固定的点
      // 切换选中有重叠部分的对象
      switchObjects: {
        objects: [], // 当前可切换的所有对象
        currentIndex: 0, // 当前选中的对象索引
        // 选中下一个对象
        next: function() {
          this.currentIndex =
            this.currentIndex === this.objects.length - 1
              ? 0
              : ++this.currentIndex
          return this.objects[this.currentIndex]
        },
        // 初始化所有属性
        init: function() {
          this.objects = []
          this.currentIndex = 0
        }
      },
      // 初始化所有绘制状态
      init() {
        this.isDrawing = false
        this.drawObj = null
        this.polyLinePoints = []
        this.switchObjects.init()
        this.deformationing = false
      }
    }
    this._toolStatus = new Proxy(
      {
        referenceLine: false, // 是否显示辅助线
        hideLabel: null, // 是否隐藏标签名称
        rectArea: true, // 是否矩形面积限制
        type: '', // 当前的工具类型
        onlySelected: false // 仅支持选中框
      },
      {
        set: (target, propKey, value, receiver) => {
          if (propKey === 'type' && value === 'brush') {
            this.clearAuxiliaryLine()
          }
          return Reflect.set(target, propKey, value, receiver)
        }
      }
    )
    this._supportTypes = ['rect', 'polygon', 'point', 'brush', 'polyline']
  }

  // 初始化画布
  _initCanvas(el, options) {
    this._fabricCanvas = new fabric.Canvas(el, {
      imageSmoothingEnabled: false,
      includeDefaultValues: false,
      selection: false,
      enableRetinaScaling: false,
      ...options
    })
    this.fabricCanvas = this._fabricCanvas
  }

  // 画布的事件监听
  _addCanvasEventListener() {
    const canvas = this._fabricCanvas,
      mouseStatus = this._mouseStatus,
      drawStatus = this._drawStatus,
      keyStatus = this._keyStatus,
      toolStatus = this._toolStatus
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let _clipboardFrames: any[] = []
    fabric.util.addListener(this._canvasContainer, 'mousewheel', options => {
      // if (options.target.toElement !== canvas.upperCanvasEl) return;
      // if (keyStatus.command) {
      const delta = options.wheelDelta
      if (delta !== 0) {
        let zoom = canvas.getZoom()
        const pointer = canvas.getPointer(options, true)
        const point = new fabric.Point(pointer.x, pointer.y)
        if (delta > 0) {
          zoom += zoom * 0.05
          if (zoom > 10) zoom = 10
          canvas.zoomToPoint(point, zoom)
        } else if (delta < 0) {
          zoom -= zoom * 0.05
          if (zoom < 0.3) zoom = 0.3
          canvas.zoomToPoint(point, zoom)
        }
      }
      // }
    })
    fabric.util.addListener(document.body, 'keydown', options => {
      // e键结束绘制
      if (options.keyCode === 69) {
        if (drawStatus.isDrawing) {
          const type = toolStatus.type,
            isPoly = type === 'polygon' || type === 'polyline'
          if (isPoly) {
            const points = [...drawStatus.polyLinePoints],
              minLength = type === 'polygon' ? 3 : 2
            if (points.length < minLength) {
              this.removeObj(drawStatus.drawObj)
            } else {
              this._draw(
                {
                  points
                },
                type
              )
              this.setActiveObject(drawStatus.drawObj)
            }
          }
          drawStatus.init()
        }
      }
      // t键切换层级
      if (options.keyCode === 84) {
        if (drawStatus.switchObjects.objects.length === 0) {
          const objects = canvas.getObjects()
          const activeObject = canvas.getActiveObjects()[0]
          const obj = objects.filter(v => {
            return (
              activeObject !== v &&
              v.type !== 'image' &&
              activeObject.intersectsWithObject(v)
            )
          })
          obj.unshift(activeObject)
          drawStatus.switchObjects.objects.push(...obj)
        }
        const nextObj = drawStatus.switchObjects.next()
        this.setActiveObject(nextObj)
      }
      // command键
      if (isKeyCommand(options.keyCode) && !keyStatus.isCommand) {
        keyStatus.isCommand = true
      }
      // command + c 复制画框
      if (keyStatus.isCommand && options.keyCode === 67) {
        keyStatus.isCommand = false
        setTimeout(() => {
          if (this._activeObjects.length) {
            _clipboardFrames = [...this._activeObjects]
          }
        }, 200)
      }
      // command + v 粘贴画框
      if (keyStatus.isCommand && options.keyCode === 86) {
        if (_clipboardFrames.length) {
          _clipboardFrames.forEach(obj => {
            this._redrawObj(obj, 0)
          })
        }
        keyStatus.isCommand = false
      }
      // 空格键移动画布
      if (options.keyCode === 32) {
        this.setKeyStatus('space', true)
        if (!keyStatus.spaceStartTime) {
          this.setKeyStatus('spaceStartTime', new Date().getTime())
        }
      }
    })
    fabric.util.addListener(document.body, 'keyup', options => {
      if (options.keyCode === 32) {
        const spaceEndTime = new Date().getTime()
        if (spaceEndTime - keyStatus.spaceStartTime < 500) {
          this.fixIn()
        }
        this.clearKeyStatus()
      }
    })

    // 移动画布
    canvas.on('mouse:down', options => {
      const pointer = canvas.getPointer(options.e, true)
      mouseStatus.mouseDownPoint = new fabric.Point(pointer.x, pointer.y)
    })
    canvas.on('mouse:up', () => {
      mouseStatus.mouseDownPoint = null
    })
    canvas.on('mouse:move', options => {
      if (keyStatus[keyStatus.moveKey] && mouseStatus.mouseDownPoint) {
        const pointer = canvas.getPointer(options.e, true)
        const mouseMovePoint = new fabric.Point(pointer.x, pointer.y)
        canvas.relativePan(mouseMovePoint.subtract(mouseStatus.mouseDownPoint))
        mouseStatus.mouseDownPoint = mouseMovePoint
      }
    })

    // 绑定画布操作事件
    canvas.on('mouse:down:before', options => {
      const pointer = this.getPointer(this._fabricCanvas, options, false)
      if (toolStatus.type === 'brush' && this.isOnImage(pointer)) {
        this._startBrush()
      }
    })
    canvas.on('mouse:down', options => {
      const pointer = this.getPointer(this._fabricCanvas, options, false)
      const activeObjects = this._activeObjects
      mouseStatus.mouseDown = true
      mouseStatus.mouseFrom = pointer
      if (!this.isOnImage(pointer) || keyStatus.command) {
        return
      }
      if (
        this._supportTypes.includes(toolStatus.type) &&
        activeObjects.length === 0
      ) {
        drawStatus.isDrawing = true
      }
      if (drawStatus.isDrawing) {
        const type = toolStatus.type
        if (type === 'polygon' || type === 'polyline') {
          drawStatus.polyLinePoints.push({
            x: pointer.x,
            y: pointer.y
          })
          const optioins = this._getPolyPoints(
            [...drawStatus.polyLinePoints],
            pointer
          )
          this._draw(optioins, type)
        }
        if (type === 'point') {
          this._draw(pointer, 'point')
          this.setActiveObject(drawStatus.drawObj)
          drawStatus.init()
        }
      }
    })
    canvas.on('mouse:move', options => {
      const pointer = this.getPointer(this._fabricCanvas, options, false),
        activeObjects = this._activeObjects
      if (toolStatus.referenceLine && toolStatus.type !== 'brush') {
        this.drawAuxiliaryLine(options)
      }
      if (drawStatus.isDrawing && activeObjects.length === 0) {
        mouseStatus.mouseTo = pointer
        if (toolStatus.type === 'rect') {
          const option = this._getRectOption(
            mouseStatus.mouseFrom,
            mouseStatus.mouseTo
          )
          this._draw(option, 'rect')
        }
        const type = toolStatus.type
        if (type === 'polygon' || type === 'polyline') {
          const optioins = this._getPolyPoints(
            [...drawStatus.polyLinePoints],
            pointer
          )
          this._draw(optioins, type)
        }
        if (type === 'brush') {
          if (!this.isOnImage(pointer)) {
            this._suspendBrush()
          } else {
            this._startBrush()
          }
        }
      }
    })
    canvas.on('mouse:out', () => {
      if (toolStatus.referenceLine) {
        this.clearAuxiliaryLine()
      }
    })
    canvas.on('mouse:up:before', options => {
      const pointer = this.getPointer(this._fabricCanvas, options, false)
      const type = toolStatus.type
      if (type === 'brush') {
        if (!this.isOnImage(pointer)) {
          this._startBrush()
        }
      }
    })
    canvas.on('mouse:up', () => {
      const activeObjects = this._activeObjects
      mouseStatus.init()
      const isDrawing = drawStatus.isDrawing && activeObjects.length === 0
      if (
        isDrawing &&
        (toolStatus.type === 'rect' || toolStatus.type === 'brush')
      ) {
        if (drawStatus.drawObj) {
          // const { width, height, left, top } = drawStatus.drawObj
          const { width, height } = drawStatus.drawObj
          if ((width < 3 || height < 3) && toolStatus.rectArea) {
            this.message(
              'warning',
              '该矩形的长或者宽小于3不符合要求，请重新画框'
            )
            this.removeObj(drawStatus.drawObj)
          } else if (width * height < 50 && toolStatus.rectArea) {
            this.message('warning', '框的面积太小，请重新画框')
            this.removeObj(drawStatus.drawObj)
          } else {
            this.setActiveObject(drawStatus.drawObj)
          }
          // this.clip(this.taskImage.url, {
          //   width,
          //   height,
          //   left,
          //   top
          // })
        }
        if (toolStatus.type === 'brush') {
          this._stopBrush()
        }
        drawStatus.init()
        // this.setCursor(toolStatus.type)
      }
      if (drawStatus.deformationing && drawStatus.drawObj) {
        this._redrawObj(drawStatus.drawObj)
        drawStatus.init()
      }
    })
    canvas.on('selection:created', options => {
      options.selected.forEach(v => {
        if (v.type === 'labelPolygon' || v.type === 'labelPolyline') {
          this.setControls(v)
        }
        v.set('selected', true)
      })
      canvas.renderAll()
    })
    canvas.on('selection:updated', options => {
      options.selected.forEach(v => {
        if (v.type === 'labelPolygon' || v.type === 'labelPolyline') {
          this.setControls(v)
        }
        v.set('selected', true)
      })
      options.deselected.forEach(v => {
        if (v.type === 'labelPolygon' || v.type === 'labelPolyline') {
          this.setControls(v, 1)
        }
        v.set('selected', false)
      })
      canvas.renderAll()
      drawStatus.switchObjects.init()
    })
    canvas.on('selection:cleared', options => {
      if (options.deselected) {
        options.deselected.forEach(v => {
          if (v.type === 'labelPolygon' || v.type === 'labelPolyline') {
            this.setControls(v, 1)
          }
          v.set('selected', false)
        })
      }
      drawStatus.init()
      canvas.renderAll()
    })

    // 对象缩放事件
    const scaling = () => {
      let isScaling = false
      let timer
      return option => {
        if (isScaling) {
          clearTimeout(timer)
        }
        isScaling = true
        timer = setTimeout(() => {
          this._redrawObj(option.target)
          isScaling = false
        }, 500)
      }
    }
    canvas.on('object:scaling', scaling())

    // 对象移动事件
    canvas.on('object:moving', options => {
      const obj = options.target
      const imgObj = this._imgObj
      const [width, height] = [imgObj.width, imgObj.height]
      if (obj.left <= 0) {
        obj.left = 0
      } else if (obj.left + obj.width >= width) {
        obj.left = width - obj.width
      }
      if (obj.top <= 0) {
        obj.top = 0
      } else if (obj.top + obj.height >= height) {
        obj.top = height - obj.height
      }
    })
  }

  // 添加图片
  addBaseImg(url) {
    return new Promise(resolve => {
      this.getImgObj(url).then(imgObj => {
        this._fabricCanvas.add(imgObj)
        resolve(imgObj)
      })
    })
  }

  // 获取图片对象
  getImgObj(url) {
    return new Promise(resolve => {
      const img = document.createElement('img')
      img.onload = () => {
        const obj = {
          imageSmoothingEnabled: false,
          includeDefaultValues: false,
          selection: false,
          enableRetinaScaling: false,
          lockMovementX: true,
          lockMovementY: true,
          selectable: false
          // hoverCursor: 'auto'
        }
        const image = new fabric.Image(img, obj)
        resolve(image)
      }
      img.src = url
    })
  }

  // 设置key状态
  setKeyStatus(key, value) {
    this._keyStatus[key] = value
  }

  // 清除key状态
  clearKeyStatus() {
    Object.keys(this._keyStatus).forEach(v => {
      if (typeof this._keyStatus[v] !== 'string' && !!this._keyStatus[v]) {
        this.setKeyStatus(v, false)
      }
    })
  }

  // 清除画布
  clearCanvas() {
    if (this._fabricCanvas && this._fabricCanvas.getObjects().length > 0) {
      this._fabricCanvas.clear()
    }
  }

  // 设置画布对象尺寸
  setZoom(SIZE?) {
    const canvas = this._fabricCanvas
    let zoom = 1
    const eleHeight = this._canvasContainer.clientHeight
    const eleWidth = this._canvasContainer.clientWidth

    if (canvas.item(0)) {
      SIZE = canvas.item(0)
    } else {
      SIZE = {
        height: eleHeight,
        which: eleWidth
      }
    }

    const rate = eleWidth / eleHeight
    const imgRate = SIZE.width / SIZE.height
    const width = eleWidth
    const height = eleHeight
    const ratio = imgRate > rate
    if (ratio) {
      zoom = width / SIZE.width
    } else {
      zoom = height / SIZE.height
    }
    // if (fixInbol) {
    //     canvas.setZoom(1);
    //     canvas.setWidth(SIZE.width);
    //     canvas.setHeight(SIZE.height);
    // } else {
    canvas.setZoom(zoom)
    canvas.setWidth(width)
    canvas.setHeight(height)
    if (SIZE.set) {
      canvas.absolutePan({
        x: (SIZE.width * zoom - width) / 2,
        y: (SIZE.height * zoom - height) / 2
      })
    }
    // }
    // this.editorStatus.canvasStatus.zoom = zoom
    canvas.renderAll()
    return ratio
  }

  //  设置工具状态
  setConfig(options) {
    // this._toolStatus = Object.assign(this._toolStatus, options)
    Object.keys(options).forEach(propKey => {
      const oldVal = this._toolStatus[propKey],
        newVal = options[propKey]
      // eslint-disable-next-line no-prototype-builtins
      if (this._toolStatus.hasOwnProperty(propKey) && oldVal !== newVal) {
        this._toolStatus[propKey] = newVal
      }
    })
  }

  // 设置工具类型
  _setToolType(type) {
    this._toolStatus.type = type
  }

  // 获取options的点坐标
  getPointer(canvas, options, bol = true) {
    const pointer = canvas.getPointer(options.e, bol)
    return new fabric.Point(pointer.x, pointer.y)
  }

  // 判断点是否在图片上
  isOnImage(pointer, vague?) {
    const imgObj = this._imgObj
    if (!imgObj) return false
    const [width, height] = [imgObj.width, imgObj.height]
    if (vague) {
      return (
        pointer.x > vague &&
        pointer.x < width - vague &&
        pointer.y > vague &&
        pointer.y < height - vague
      )
    }
    return (
      pointer.x > 0 && pointer.x < width && pointer.y > 0 && pointer.y < height
    )
  }

  // 参考线
  drawAuxiliaryLine(options) {
    const ctx = this._fabricCanvas.getSelectionContext()
    const pointer = this.getPointer(this._fabricCanvas, options, false),
      canvasPointer = this.getPointer(this._fabricCanvas, options, true)
    if (this.isOnImage(pointer)) {
      this._fabricCanvas.clearContext(this._fabricCanvas.contextTop)
      ctx.save()
      ctx.lineWidth = 2
      ctx.strokeStyle = 'red'
      ctx.setLineDash([2])
      ctx.beginPath()
      ctx.moveTo(canvasPointer.x, 0)
      ctx.lineTo(canvasPointer.x, this._fabricCanvas.height)
      ctx.moveTo(0, canvasPointer.y)
      ctx.lineTo(this._fabricCanvas.width, canvasPointer.y)
      ctx.stroke()
      ctx.restore()
    } else {
      this.clearAuxiliaryLine(ctx)
    }
  }

  // 清除参考线
  clearAuxiliaryLine(ctx?) {
    const _ctx = ctx ? ctx : this._fabricCanvas.contextTop
    this._fabricCanvas.clearContext(_ctx)
  }

  // 设置选中对象
  setActiveObject(obj) {
    this._fabricCanvas.setActiveObject(obj)
    this._fabricCanvas.renderAll()
  }

  // 删除对象
  removeObj(obj) {
    if (this._fabricCanvas.contains(obj)) {
      this._fabricCanvas.remove(obj)
    }
  }

  // 根据工具类型画框
  _draw(option, type) {
    const drawStatus = this._drawStatus
    let obj
    if (type === 'rect') {
      obj = this._getRectObj(option)
    }
    if (type === 'polygon') {
      obj = this._getPolygonObj(option)
    }
    if (type === 'point') {
      obj = this._getPointObj(option)
    }
    if (type === 'polyline') {
      obj = this._getPolylineObj(option)
    }
    if (type === 'brush') {
      this._drawPath(option, 1)
      return
    }
    if (drawStatus.isDrawing) {
      this._fabricCanvas.remove(drawStatus.drawObj)
      drawStatus.drawObj = obj
    }
    this._setCornerStyle(obj)
    this._fabricCanvas.add(obj)
    this._fabricCanvas.renderAll()
    return obj
  }

  draw(option, type) {
    this._draw(option, type)
  }

  // 重新绘制对象
  _redrawObj(obj, isRemove = 1) {
    const frameId = obj.frameId
    const op = obj.toJSON()
    const {
      width,
      height,
      left,
      top,
      fill,
      stroke,
      hideLabel,
      label,
      scaleX,
      scaleY,
      points
    } = op
    let newObj
    if (obj.type === 'labelRect') {
      newObj = this._draw(
        {
          width: width * scaleX,
          height: height * scaleY,
          left,
          top,
          fill,
          stroke,
          hideLabel,
          label,
          frameId,
          modify: frameId ? true : undefined
        },
        'rect'
      )
    }
    if (obj.type === 'labelPolygon') {
      const newpoints = points.map(v => {
        return {
          x: v.x * scaleX,
          y: v.y * scaleY
        }
      })
      newObj = this._draw(
        {
          // width: width * scaleX,
          // height: height * scaleY,
          // left,
          // top,
          fill,
          stroke,
          hideLabel,
          label,
          points: newpoints,
          frameId,
          modify: frameId || undefined
        },
        'polygon'
      )
    }
    if (obj.type === 'labelPolyline') {
      const newpoints = points.map(v => {
        return {
          x: v.x * scaleX,
          y: v.y * scaleY
        }
      })
      newObj = this._draw(
        {
          // width: width * scaleX,
          // height: height * scaleY,
          // left,
          // top,
          fill,
          stroke,
          hideLabel,
          label,
          points: newpoints,
          frameId,
          modify: frameId || undefined
        },
        'polyline'
      )
    }
    if (obj.type === 'labelPath') {
      this._drawPath(obj, 1)
      return
    }
    if (isRemove) {
      this.removeObj(obj)
    }
    this.setActiveObject(newObj)
  }

  // 根据点获取新的rect框位置尺寸相关配置项
  _getRectOption(from, to) {
    let top = from.y,
      left = from.x
    if (from.y < to.y) {
      to.y = Math.min(this._imgObj.height, to.y)
    }
    if (from.y > to.y) {
      to.y = Math.max(0, to.y)
      top = to.y
    }
    if (from.x > to.x) {
      to.x = Math.max(0, to.x)
      left = to.x
    }
    if (from.x < to.x) {
      to.x = Math.min(this._imgObj.width, to.x)
    }
    const option = {
      left,
      top,
      width: Math.abs(from.x - to.x) - 2,
      height: Math.abs(from.y - to.y) - 2
    }
    return option
  }

  // 根据配置获取新的rect框对象
  _getRectObj(option) {
    const obj = new fabric['LabelRect']({
      ...this._baseDrawStatus,
      hideLabel: false,
      // label: this.labelName || undefined,
      ...option
    })
    // if (this._fabricCanvas.getObjects().length < 3) {
    //   obj.setControlsVisibility({ mtr: true })
    // }
    obj.on('scaling', e => {
      const obj = e.transform.target
      const width = obj.scaleX * obj.width
      const height = obj.scaleY * obj.height
      const imgObj = this._imgObj
      const [imgwidth, imgheight] = [imgObj.width, imgObj.height]
      if (obj.left <= 0) {
        obj.left = 0
      }
      if (width + obj.left > imgwidth) {
        obj.scaleX = (imgwidth - obj.left) / obj.width
      }
      if (obj.top <= 0) {
        obj.top = 0
      }
      if (obj.top + height > imgheight) {
        obj.scaleY = (imgheight - obj.top) / obj.height
      }
    })
    return obj
  }

  // 根据配置获取新的Polygon框对象
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _getPolygonObj(option: any = {}) {
    const points = option.points ? [...option.points] : []
    delete option.points
    const obj = new fabric['LabelPolygon'](points, {
      ...this._baseDrawStatus,
      hideLabel: false,
      // label: this.labelName || undefined,
      ...option,
      objectCaching: false,
      transparentCorners: false
    })
    return obj
  }

  // 根据点获取新的Polygon框位置尺寸相关配置项
  _getPolyPoints(current, to) {
    const option = {
      points: [...current]
    }
    to.x = to.x < 0 ? Math.max(to.x, 0) : Math.min(this._imgObj.width, to.x)
    to.y = to.y < 0 ? Math.max(to.y, 0) : Math.min(this._imgObj.height, to.y)
    option.points.push(to)
    return option
  }

  // 获取Point对象
  _getPointObj(pointer) {
    let radius = pointer.radius ? pointer.radius : 10
    radius = radius / this.currentZoom
    const options = {
      ...this._baseDrawStatus,
      hideLabel: false,
      stroke: 'rgba(0,0,0,0)',
      hasControls: false,
      radius,
      left: pointer.x - radius,
      top: pointer.y - radius,
      note: pointer.note || '',
      frameId: pointer.frameId,
      label: pointer.label
    }
    const obj = new fabric['LabelKeyPoint'](options)
    return obj
  }

  // 获取折线对象
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _getPolylineObj(option: any = {}) {
    const points = option.points ? [...option.points] : []
    delete option.points
    const obj = new fabric['LabelPolyline'](points, {
      ...this._baseDrawStatus,
      hideLabel: false,
      // label: this.labelName || undefined,
      ...option,
      objectCaching: false,
      transparentCorners: false
      // cornerColor: 'rgba(0,0,255,0.5)'
    })
    return obj
  }

  // _drawPath
  _drawPath(pathObj, isDraw?) {
    if (isDraw) {
      const path = pathObj.path
      delete pathObj.path
      const newObj = new fabric['LabelPath'](path, {
        ...this._baseDrawStatus,
        fill: pathObj.fill,
        stroke: pathObj.stroke,
        label: pathObj.label,
        hideLabel: false,
        ...pathObj
      })
      this._setCornerStyle(newObj)
      newObj.set({
        hasControls: false,
        lockMovementX: true,
        lockMovementY: true
      })
      this._fabricCanvas.add(newObj)
      return
    }
    const {
      width,
      height,
      left,
      top,
      fill,
      stroke,
      strokeWidth,
      // hideLabel,
      label,
      scaleX,
      scaleY,
      path,
      pathOffset
    } = pathObj.toJSON()
    const obj = {
      width: width * scaleX,
      height: height * scaleY,
      left,
      top,
      fill,
      stroke,
      strokeWidth,
      hideLabel: false,
      label,
      pathOffset,
    }
    const newObj = new fabric['LabelPath'](
      this.pasePath(path, {
        x: scaleX,
        y: scaleY
      }),
      {
        ...obj,
        ...this._baseDrawStatus,
        hasControls: false
      }
    )
    this._setCornerStyle(newObj)
    this._fabricCanvas.remove(pathObj)
    this._fabricCanvas.add(newObj)
    this.setActiveObject(newObj)
  }

  // 获取brush对象
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _getBrushObj(pathObj: any = {}) {
    const path = pathObj.path
    delete pathObj.path
    const newObj = new fabric['LabelPath'](path, {
      ...this._baseDrawStatus,
      fill: pathObj.fill,
      stroke: pathObj.stroke,
      label: pathObj.label,
      hideLabel: false,
      ...pathObj
    })
    return newObj
  }

  // 开始画笔
  _startBrush() {
    // const obj = new fabric.PencilBrush(this._fabricCanvas)
    // this._fabricCanvas.freeDrawingBrush = obj
    // const zoom = this._fabricCanvas.getZoom()
    this._fabricCanvas.freeDrawingBrush.width = 2 / this.currentZoom
    this._fabricCanvas.freeDrawingBrush.color = this._baseDrawStatus.stroke
    this._fabricCanvas.isDrawingMode = true
  }

  // 暂停画笔
  _suspendBrush() {
    this._fabricCanvas.isDrawingMode = false
  }

  // 停止画笔
  _stopBrush() {
    this._fabricCanvas.isDrawingMode = false
    const objs = this._fabricCanvas.getObjects()
    const theObj = objs[objs.length - 1]
    this._drawPath(theObj)
  }

  // 根据编辑状态设置鼠标样式
  setCursor(type, _cursor?) {
    let cursor = _cursor
    if (cursor) {
      this._resetCursor(cursor)
      return
    }
    if (!type) {
      cursor = 'auto'
    }
    if (this._supportTypes.includes(type)) {
      cursor = 'crosshair'
    }
    if (type === 'choice') {
      cursor = 'all-scroll'
    }
    this._resetCursor(cursor)
  }

  // 设置鼠标样式
  _resetCursor(cursor) {
    this._fabricCanvas.hoverCursor = cursor
    this._fabricCanvas.setCursor(cursor)
    // const imgInterface = this.imgObj
    // imgInterface.hoverCursor = cursor
    // imgInterface.defaultCursor = cursor
  }

  // 消息通知
  message(a, b) {
    console.log(a, b)
  }

  // 可选状态
  setAllObjectsCanActive(selectable) {
    const objs = this._fabricCanvas.getObjects().slice(1)
    objs.forEach(obj => {
      obj.set({ selectable })
    })
  }

  // 适应画布
  fixIn() {
    this.setZoom(this._fabricCanvas)
  }

  // 删除选中的框
  deleteActive() {
    const activeObjects = this._activeObjects
    if (activeObjects.length > 0) {
      activeObjects.forEach(v => {
        this.removeObj(v)
      })
    }
  }

  // 设置对象控制点样式
  _setCornerStyle(obj) {
    if (!obj) return
    obj.set({
      cornerSize: 10,
      transparentCorners: false,
      cornerStyle: 'circle'
      // controls: obj.points.reduce(function(acc, point, index) {
      //   acc['p' + index] = new fabric.Control({
      //     positionHandler: polygonPositionHandler,
      //     actionHandler: anchorWrapper(index > 0 ? index - 1 : lastControl, actionHandler),
      //     actionName: 'modifyPolygon',
      //     pointIndex: index
      //   })
      //   return acc
      // }, { })
    })
  }

  // 转换计算缩放后的path
  pasePath(path, scale) {
    if (scale) {
      path = path.map(v => {
        return v.map((m, k) => {
          if (k !== 0) {
            return k % 2 !== 0 ? m * scale.x : m * scale.y
          } else {
            return m
          }
        })
      })
    }
    return path
      .map(v => {
        return v.join(' ')
      })
      .join(' ')
  }

  // 为选中的框添加标签
  addLabel(labelName) {
    const activeObjects = this._activeObjects
    if (activeObjects.length < 1) {
      return
    }
    activeObjects.forEach(v => {
      v.set({
        label: labelName
      })
      this._fabricCanvas.requestRenderAll()
    })
  }

  // 重新渲染canvas
  setDimensions(option) {
    this._fabricCanvas.setDimensions({
      ...option
    })
    // this._fabricCanvas.setHeight(option.height)
    // this._fabricCanvas.setWidth(option.width)
    this.fixIn()
  }

  // 解析画布数据
  parseData(objs, isEmpty?) {
    const labels = objs.slice(1),
      imgobj = objs[0]
    let labelData
    if (isEmpty) {
      labelData = []
    } else {
      const shapes = labels
        .map((v, k) => {
          if (!v) return null
          const coordinates = this.getCoordinates(v, imgobj)
          // const scaleX = v.scaleX || 1
          // const scaleY = v.scaleY || 1
          return {
            fill_color: v.fill,
            line_color: v.stroke,
            label_name: v.label,
            type: v.type,
            originalType: this._getOriginalTypeName(v.type),
            coordinates,
            order: k + 1,
            _object: v,
            note: v.note
          }
        })
        .filter(v => v)
      labelData = shapes
    }
    return labelData
  }

  // 获取对象的坐标信息
  getCoordinates(obj, imgObj) {
    const scaleX = obj.scaleX || 1
    const scaleY = obj.scaleY || 1
    if (obj.type === 'labelRect') {
      return [
        obj.left / imgObj.width,
        obj.top / imgObj.height,
        (obj.left + obj.width * scaleX) / imgObj.width,
        (obj.top + obj.height * scaleY) / imgObj.height
      ]
    }
    if (obj.type === 'labelPolygon' || obj.type === 'labelPolyline') {
      return obj.points.map(v => {
        return {
          x: v.x / imgObj.width,
          y: v.y / imgObj.height
        }
      })
    }
    if (obj.type === 'labelKeyPoint') {
      return [
        (obj.left + obj.radius) / imgObj.width,
        (obj.top + obj.radius) / imgObj.height
      ]
    }
    if (obj.type === 'labelPath') {
      return obj.path.map(v => {
        return v.map((value, key) => {
          if (key !== 0) {
            if (key % 2) {
              return value / imgObj.width
            } else {
              return value / imgObj.height
            }
          }
          return value
        })
      })
    }
  }

  // 重新渲染
  rerender() {
    return this._fabricCanvas.requestRenderAll()
  }

  // 取消选中
  directiveObj(obj) {
    return this._fabricCanvas.discardActiveObject(obj)
  }

  // 原类型名
  _getOriginalTypeName(type) {
    if (type === 'labelRect') return 'rect'
    if (type === 'labelPolygon') return 'polygon'
    if (type === 'labelPolyline') return 'polyline'
    if (type === 'labelKeyPoint') return 'point'
    if (type === 'labelPath') return 'brush'
  }

  // 清除所有框
  clearAllFrames() {
    if (
      this._fabricCanvas &&
      this._fabricCanvas.getObjects().length > 1 &&
      this.imgObj
    ) {
      this._fabricCanvas.getObjects().forEach(v => {
        if (v !== this.imgObj) this.removeObj(v)
      })
    }
  }

  // 设置对象自定义控制点
  setControls(obj, isDefault?) {
    if (this._toolStatus.onlySelected) return
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this
    // function polygonPositionHandler (dim, finalMatrix, fabricObject) {
    //   const x =
    //       fabricObject.points[this.pointIndex].x - fabricObject.pathOffset.x,
    //     y = fabricObject.points[this.pointIndex].y - fabricObject.pathOffset.y
    //   const conf: any = { x: x, y: y }
    //   return fabric.util.transformPoint(
    //     conf,
    //     fabric.util.multiplyTransformMatrices(
    //       fabricObject.canvas.viewportTransform,
    //       fabricObject.calcTransformMatrix()
    //     )
    //   )
    // }

    function getObjectSizeWithStroke(object) {
      const stroke = new fabric.Point(
        object.strokeUniform ? 1 / object.scaleX : 1,
        object.strokeUniform ? 1 / object.scaleY : 1
      ).multiply(object.strokeWidth)
      return new fabric.Point(object.width + stroke.x, object.height + stroke.y)
    }

    // define a function that will define what the control does
    // this function will be called on every mouse move after a control has been
    // clicked and is being dragged.
    // The function receive as argument the mouse event, the current trasnform object
    // and the current position in canvas coordinate
    // transform.target is a reference to the current object being transformed,
    function actionHandler(eventData, transform, x, y) {
      const polygon = transform.target,
        currentControl = polygon.controls[polygon.__corner],
        mouseLocalPosition = polygon.toLocalPoint(
          new fabric.Point(x, y),
          'center',
          'center'
        ),
        polygonBaseSize = getObjectSizeWithStroke(polygon),
        size = polygon._getTransformedDimensions(0, 0),
        nx =
          (mouseLocalPosition.x * polygonBaseSize.x) / size.x +
          polygon.pathOffset.x,
        ny =
          (mouseLocalPosition.y * polygonBaseSize.y) / size.y +
          polygon.pathOffset.y,
        finalPointPosition = {
          // x:
          //   (mouseLocalPosition.x * polygonBaseSize.x) / size.x +
          //   polygon.pathOffset.x,
          // y:
          //   (mouseLocalPosition.y * polygonBaseSize.y) / size.y +
          //   polygon.pathOffset.y
          x: nx < 0 ? Math.max(nx, 0) : Math.min(_this._imgObj.width, nx),
          y: ny < 0 ? Math.max(ny, 0) : Math.min(_this._imgObj.height, ny)
        }
      // x = nx < 0 ? Math.max(nx, 0) : Math.min(_this._imgObj.width, nx)
      // y = ny < 0 ? Math.max(ny, 0) : Math.min(_this._imgObj.height, ny)
      polygon.points[currentControl.pointIndex] = finalPointPosition
      _this._drawStatus.deformationing = true
      _this._drawStatus.drawObj = polygon
      return true
    }

    // define a function that can keep the polygon in the same position when we change its
    // width/height/top/left.
    function anchorWrapper(anchorIndex, fn) {
      return function(eventData, transform, x, y) {
        const fabricObject = transform.target,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          confObj: any = {
            x: fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x,
            y: fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y
          },
          absolutePoint = fabric.util.transformPoint(
            confObj,
            fabricObject.calcTransformMatrix()
          ),
          actionPerformed = fn(eventData, transform, x, y),
          // newDim = fabricObject._setPositionDimensions({}),
          polygonBaseSize = getObjectSizeWithStroke(fabricObject),
          newX =
            (fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x) /
            polygonBaseSize.x,
          newY =
            (fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y) /
            polygonBaseSize.y
        fabricObject.setPositionByOrigin(absolutePoint, newX + 0.5, newY + 0.5)
        return actionPerformed
      }
    }
    if (isDefault) {
      obj.hasBorders = true
      // obj.cornerColor = 'rgba(0,0,255,0.5)'
      obj.cornerStyle = 'rect'
      obj.controls = fabric.Object.prototype.controls
    } else {
      const lastControl = obj.points.length - 1
      obj.cornerStyle = 'circle'
      // obj.cornerColor = 'rgba(0,0,255,0.5)'
      obj.hasBorders = false
      obj.controls = obj.points.reduce(function(acc, point, index) {
        const conf = {
          positionHandler: function (dim, finalMatrix, fabricObject) {
            const x =
                fabricObject.points[this.pointIndex].x - fabricObject.pathOffset.x,
              y = fabricObject.points[this.pointIndex].y - fabricObject.pathOffset.y
            const conf: any = { x: x, y: y }
            return fabric.util.transformPoint(
              conf,
              fabric.util.multiplyTransformMatrices(
                fabricObject.canvas.viewportTransform,
                fabricObject.calcTransformMatrix()
              )
            )
          },
          actionHandler: anchorWrapper(
            index > 0 ? index - 1 : lastControl,
            actionHandler
          ),
          actionName: 'modifyPolygon',
          pointIndex: index
        }
        acc['p' + index] = new fabric.Control(conf)
        return acc
      }, {})
    }
    this.rerender()
  }

  // 获取画框对象
  getFrameObj(option, type) {
    let obj
    if (type === 'rect') {
      obj = this._getRectObj(option)
    }
    if (type === 'polygon') {
      obj = this._getPolygonObj(option)
    }
    if (type === 'point') {
      obj = this._getPointObj(option)
    }
    if (type === 'polyline') {
      obj = this._getPolylineObj(option)
    }
    if (type === 'brush') {
      obj = this._getBrushObj(option)
    }
    return obj
  }
}

export {
  fabricModify,
  Annotator
}
