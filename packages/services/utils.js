// 是否mac
function _isMac() {
  return OSnow() === 'isMac'
}
//是否windows
function _isWin() {
  return OSnow() === 'isWin'
}

function isKeyCommand(keyCode) {
  return (_isMac() && keyCode === 91) || (_isWin() && keyCode === 17)
}

function OSnow() {
  var agent = navigator.userAgent.toLowerCase()
  var _isMac = /macintosh|mac os x/i.test(navigator.userAgent)
  if (
    agent.indexOf('win32') >= 0 ||
    agent.indexOf('wow32') >= 0 ||
    agent.indexOf('win64') >= 0 ||
    agent.indexOf('wow64') >= 0
  ) {
    return 'isWin'
  }
  if (_isMac) {
    return 'isMac'
  }
}

function parseFrameOption(labelInfo, imgEl) {
  const coordinates = eval(labelInfo.coordinate)
  const imgObj = imgEl
  if (!imgObj) return
  const imgW = imgObj.width,
    imgH = imgObj.height,
    baseOption = {
      fill: labelInfo.fill_color || '',
      stroke: labelInfo.stroke_color || 'red',
      label: labelInfo.label_name,
      note: labelInfo.notes || '',
      frameId: labelInfo.id,
      originType: labelInfo.draw_frame_type
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

const isMac = _isMac(),
  isWin = _isWin()

export { isMac, isWin, isKeyCommand, parseFrameOption }
