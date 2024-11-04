import { App, Reactive } from "vue"
import {Annotator} from './index'
import { EventBus } from "../tools/eventBus";

// type addLabelFn = (labelName: string) => void;
// type rerenderFn = (obj: object) => void;
// type onFn = (cb: (data: string | object) => void) => void;
type installFn = (app: App) => void;

export interface EditorStatus {
  toolStatus: {
    referenceLine?: boolean | undefined;
    hideLabel?: boolean | null | undefined;
    rectArea?: boolean | undefined;
    type?: 'rect' | 'polygon' | 'point' | 'brush' | 'polyline' | string;
  };
  frameInfo: Array<object>;
  activeFrame: object;
  annotator: Annotator;
}

export interface LabelToolService {
  eventBus: Reactive<EventBus>;
  editorStatus: EditorStatus;
  addLabel: (cb) => void;
  onAddLabel: (cb: string | object) => void;
  rerender: (cb) => void;
  onRerender: (cb) => void;
  deleteFrame: (cb) => void;
  onDeleteFrame: (cb) => void;
  setActiveObj: (cb) => void;
  onSetActiveObj: (cb) => void;
  clearAllEmits: () => void;
  install: installFn;
}
// export function useLabelToolService(): LabelToolService;
// export function createLabelToolService(): LabelToolService;
export type useLabelToolService = () => LabelToolService;
export type createLabelToolService = () => LabelToolService;