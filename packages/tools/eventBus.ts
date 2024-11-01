// eventBus.js

type fn = (obj: object | string) => void

export function isValidKey(
  key: string | number | symbol,
  object: object
): key is keyof typeof object {
  return key in object;
}

interface Events {
  [eventName: string]: Array<fn>;
}

export interface EventBus {
  events: Events,
  $emit: (eventName: string, data: object | string) => void;
  $on: (eventName: string, cb: fn) => void;
  $off: (eventName: string, cb: fn) => void;
  $clear: () => void;
}
export class eventBus {
  events = {}

  $on(eventName: string, callback: fn) {
    if (!this.events[eventName]) {
      (this.events[eventName] as Array<fn>) = [];
    }
    (this.events[eventName] as Array<fn>).push(callback);
  }

  $emit(eventName: string, data) {
    if (this.events[eventName]) {
      (this.events[eventName] as Array<fn>).forEach((callback: fn) => callback(data));
    }
  }

  $off(eventName: string, callback: fn) {
    if (!this.events[eventName]) return;
    (this.events[eventName] as Array<fn>) = (this.events[eventName] as Array<fn>).filter(cb => cb !== callback);
  }

  $clear() {
    this.events = {}
  }
}
