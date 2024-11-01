import {fabric} from 'fabric'

fabric.Object.prototype.hasRotatingPoint = false
fabric.LabelRect = fabric.util.createClass(fabric.Rect, {
  type: 'labelRect',
  initialize: classInitialize,
  toObject: classToObject,
  _render(ctx) {
    drawCustom.call(this, ctx, 'labelRect')
  }
})
fabric.LabelRect.fromObject = function(options, callback) {
  callback(new fabric.LabelRect(options))
}

fabric.LabelPolygon = fabric.util.createClass(fabric.Polygon, {
  type: 'labelPolygon',
  initialize: classInitialize,
  toObject: classToObject,
  _render(ctx) {
    drawCustom.call(this, ctx, 'labelPolygon')
  }
})
fabric.LabelPolygon.fromObject = function(options, callback) {
  callback(new fabric.LabelPolygon(options))
}

fabric.LabelPolyline = fabric.util.createClass(fabric.Polyline, {
  type: 'labelPolyline',
  initialize: classInitialize,
  toObject: classToObject,
  _render(ctx) {
    drawCustom.call(this, ctx, 'labelPolyline')
  }
})
fabric.LabelPolyline.fromObject = function(options, callback) {
  callback(new fabric.LabelPolyline(options))
}

fabric.LabelKeyPoint = fabric.util.createClass(fabric.Circle, {
  type: 'labelKeyPoint',
  initialize: classInitialize,
  toObject: classToObject,
  _render(ctx) {
    drawCustom.call(this, ctx, 'labelKeyPoint')
  }
})
fabric.LabelKeyPoint.fromObject = function(options, callback) {
  callback(new fabric.LabelKeyPoint(options))
}

fabric.LabelPath = fabric.util.createClass(fabric.Path, {
  type: 'labelPath',
  initialize: classInitialize,
  toObject: classToObject,
  _render(ctx) {
    drawCustom.call(this, ctx, 'labelPath')
  }
})
fabric.LabelPath.fromObject = function(options, callback) {
  callback(new fabric.LabelPath(options))
}

function drawCustom(ctx, type) {
  const zoom = this.canvas.getZoom()
  this.callSuper('_render', ctx)
  if (type === 'labelKeyPoint') {
    drawKeyPoint(ctx, zoom)
  }
  if (this.hideLabel) return
  const fontSize = 14 / (zoom || 1)
  ctx.font = `${fontSize}px appleBlack`
  ctx.fillStyle = 'blue'
  const { width } = ctx.measureText(this.label)
  const bgPosition = {
    x: -this.width / 2,
    y: -this.height / 2 - fontSize
  }
  if (type === 'labelPolygon' || type === 'labelPolyline') {
    const points = this.toJSON().points
    const point = points.reduce((pre, cur) => {
      return !pre.y ? cur : pre.y < cur.y ? pre : cur
    }, {})
    bgPosition.x = point.x - this.pathOffset.x - width / 2
  }
  ctx.fillRect(bgPosition.x, bgPosition.y, width, fontSize)
  ctx.fillStyle = '#fff'
  const textPosition = {
    x: bgPosition.x,
    y: -this.height / 2 - 2 / (zoom || 1)
  }
  ctx.fillText(this.label, textPosition.x, textPosition.y)
}

function drawKeyPoint(ctx, zoom) {
  ctx.beginPath()
  // ctx.arc(0, 0, 3, 0, Math.PI * 2)
  // ctx.fillStyle = '#FFB0B0'
  // ctx.fill()
  ctx.strokeStyle = 'red'
  ctx.strokeWidth = 2 / zoom
  ctx.moveTo(-(6 / zoom), 0)
  ctx.lineTo(6 / zoom, 0)
  ctx.moveTo(0, -(6 / zoom))
  ctx.lineTo(0, 6 / zoom)
  ctx.stroke()
}

function classInitialize(points, options) {
  // options || (options = {})
  if (options && points) {
    this.callSuper('initialize', points, options)
  } else {
    options = points || {}
    this.callSuper('initialize', options)
  }
  this.set('label', options.label || '')
  this.set(
    'hideLabel',
    options.hideLabel === undefined ? true : options.hideLabel
  )
  this.set('visible', options.visible === undefined ? true : options.visible)
  this.set('fill', options.fill || '')
  this.set('note', options.note || '')
  this.setControlsVisibility({ mtr: false })
  if (!this.cacheProperties.includes('label')) {
    this.cacheProperties.push('label', 'hideLabel')
  }
}

function classToObject() {
  return fabric.util.object.extend(this.callSuper('toObject'), {
    label: this.get('label'),
    hideLabel: this.get('hideLabel'),
    fill: this.get('fill')
  })
}

export { fabric }
