// import { FabricImage, FabricObject, InteractiveFabricObject } from "fabric";
import { Canvas, Image, Object } from "fabric/fabric-impl";

// export type fabricModify = 
// 键盘状态
// interface KeyStatus {
//   moveKey: string; // 移动图片的辅助键名
//   isCommand: boolean; // command键是否按下
// }
export interface Annotator {
  fabricCanvas: Canvas;
  hasActiveObject: boolean;
  currentActiveObject: Object;
  frameInfo: Array<{
    fill_color: string,
    line_color: string,
    label_name: string,
    type: string,
    originalType: string,
    coordinates: Array<number>,
    order: number,
    _object: Object,
    note: string
  }>;
  imgObj: Image;
  addBaseImg: (url: string) => Promise<null>;
  getImgObj: (url: string) => Promise<Image>;
  // 设置键状态
  setKeyStatus: (key: string, value: string) => void;
  // 清除键状态
  clearKeyStatus: () => void;
  // 清除画布
  clearCanvas: () => void;
  // 设置画布对象尺寸
  setZoom(SIZE?): () => boolean;
  //  设置工具状态
  setConfig(options: {
    referenceLine?: boolean, // 是否显示辅助线
    hideLabel?: boolean | undefined | null, // 是否隐藏标签名称
    rectArea?: boolean, // 是否矩形面积限制
    type?: string, // 当前的工具类型
    onlySelected?: boolean // 仅支持选中框
  }): () => boolean;
  setActiveObject(obj: object): () => void;
  // 根据编辑状态设置鼠标样式
  setCursor(type, _cursor?): () => void;
  // 设置画布可选状态
  setAllObjectsCanActive<T = boolean>(isActive: T): (isActive: T) => void;
  // 取消选中
  directiveObj(obj: object): () => void;
  // 适应画布
  fixIn(): () => void;
  // 删除选中的框
  deleteActive(): () => void;
  // 为选中的框添加标签
  addLabel(labelName: string): () => void;
  // 清除所有框
  clearAllFrames(): () => void;
  // 画框
  draw(option: object | undefined, type: string): () => void;
  //重新渲染
  rerender(): () => void;
  // 删除画框
  removeObj(obj: object): () => void;
}