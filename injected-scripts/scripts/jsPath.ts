// eslint-disable-next-line max-classes-per-file
import IElementRect from '../interfaces/IElementRect';
import INodeTracker from '../interfaces/INodeTracker';
import IAttachedState from '../interfaces/IAttachedStateCopy';
import IExecJsPathResult from '../interfaces/IExecJsPathResult';

declare type TSON = any;

// / COPIED FROM NODERDOM! DO NOT EDIT HERE
export type IJsPath = IPathStep[];
export type IPathStep = IPropertyName | IMethod | IAttachedId;
type IPropertyName = string;
type IMethod = [IMethodName, ...IMethodArgs];
type IMethodName = string;
type IMethodArgs = any[];
type IAttachedId = number;

const stateLookup = '__getSecretAgentNodeState__';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class JsPath {
  public static async scrollIntoView(jsPath: IJsPath) {
    const element = new ObjectAtPath(jsPath).lookup().closestElement;
    if (!element) return;

    const visibleRatio = await new Promise(resolve => {
      const observer = new IntersectionObserver(entries => {
        resolve(entries[0].intersectionRatio);
        observer.disconnect();
      });
      observer.observe(element);
    });

    if (visibleRatio !== 1.0) {
      element.scrollIntoView({
        block: 'nearest',
        behavior: 'auto',
      });
      // wait until in-view
      return new Promise(resolve => {
        let observer: IntersectionObserver;
        const timeout = setTimeout(() => {
          resolve();
          if (observer) observer.disconnect();
        }, 1e3);
        observer = new IntersectionObserver(entries => {
          if (entries[0].intersectionRatio >= 1) {
            clearTimeout(timeout);
            resolve();
            observer.disconnect();
          }
        });
        observer.observe(element);
      });
    }
  }

  public static async scrollCoordinatesIntoView(coordinates: [number, number]) {
    const [left, top] = coordinates;
    const isVisible =
      top >= 0 &&
      left >= 0 &&
      top <= (window.innerHeight || document.documentElement.clientHeight) &&
      left <= (window.innerWidth || document.documentElement.clientWidth);
    if (!isVisible) {
      window.scrollTo({
        left,
        top,
        behavior: 'auto',
      });
    }
  }

  public static simulateOptionClick(jsPath: IJsPath) {
    const objectAtPath = new ObjectAtPath(jsPath);
    try {
      const currentObject = objectAtPath.lookup().objectAtPath;

      if (!currentObject || !(currentObject instanceof HTMLOptionElement)) {
        return objectAtPath.toReturnError(new Error('Option element not found'));
      }

      const element = currentObject as HTMLOptionElement;

      let didClick = false;
      const values = [element.value];
      if (element.parentNode instanceof HTMLSelectElement) {
        const select = element.parentNode as HTMLSelectElement;
        select.value = undefined;
        const options = Array.from(select.options);
        for (const option of options) {
          option.selected = values.includes(option.value);
          if (option.selected && !select.multiple) break;
        }

        select.dispatchEvent(new InputEvent('input', { bubbles: true }));
        select.dispatchEvent(new Event('change', { bubbles: true }));
        didClick = true;
      }

      // @ts-ignore
      return TSON.stringify(didClick);
    } catch (error) {
      return objectAtPath.toReturnError(error);
    }
  }

  public static getClientRect(jsPath: IJsPath) {
    const objectAtPath = new ObjectAtPath(jsPath);
    try {
      const box = objectAtPath.lookup().boundingClientRect;

      // @ts-ignore
      return TSON.stringify(box);
    } catch (error) {
      return objectAtPath.toReturnError(error);
    }
  }

  public static async exec(jsPath: IJsPath, propertiesToExtract?: string[]) {
    const objectAtPath = new ObjectAtPath(jsPath);
    try {
      const object = objectAtPath.lookup().objectAtPath;

      const returnObject: IExecJsPathResult = {
        value: null,
      };
      if (propertiesToExtract?.length && typeof object === 'object' && !Array.isArray(object)) {
        returnObject.value = {};
        for (const prop of propertiesToExtract) {
          returnObject.value[prop] = object[prop];
        }
      } else {
        returnObject.value = object;
        if (isPromise(object)) {
          returnObject.value = await object;
        }
      }

      if (objectAtPath.hasStateLoadRequest && !isPrimitive(object)) {
        returnObject.attachedState = objectAtPath.extractAttachedState();
      }

      // @ts-ignore
      return TSON.stringify(returnObject);
    } catch (error) {
      return objectAtPath.toReturnError(error);
    }
  }

  public static isVisible(jsPath: IJsPath) {
    const objectAtPath = new ObjectAtPath(jsPath);
    try {
      objectAtPath.lookup();

      const returnObject: IExecJsPathResult = {
        attachedState: objectAtPath.extractAttachedState(),
        value: objectAtPath.isVisible,
      };

      // @ts-ignore
      return TSON.stringify(returnObject);
    } catch (error) {
      return objectAtPath.toReturnError(error);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class Fetcher {
  public static createRequest(input: string | number, init?: RequestInit) {
    let requestOrUrl = input as string | Request;
    if (typeof input === 'number') {
      requestOrUrl = NodeTracker.getNodeWithId(input) as any;
    }
    const request = new Request(requestOrUrl, init);
    // @ts-ignore
    return TSON.stringify(ObjectAtPath.createAttachedState(request));
  }

  public static async fetch(input: string | number, init?: RequestInit) {
    let requestOrUrl = input as string | Request;
    if (typeof input === 'number') {
      requestOrUrl = NodeTracker.getNodeWithId(input) as any;
    }

    const response = await fetch(requestOrUrl, init);

    // @ts-ignore
    return TSON.stringify(ObjectAtPath.createAttachedState(response));
  }
}

// / Object At Path Class //////

class ObjectAtPath {
  public objectAtPath: Node | any;
  public hasStateLoadRequest: boolean;
  private lookupStep: IPathStep;
  private lookupStepIndex = 0;
  private readonly stateProperties: string[] = [];

  public get closestElement(): Element {
    if (!this.objectAtPath) return;
    if (this.isTextNode) {
      return this.objectAtPath.parentElement;
    }
    return this.objectAtPath as Element;
  }

  public get boundingClientRect() {
    const element = this.closestElement;
    if (!element) {
      return { top: 0, bottom: 0, right: 0, left: 0, width: 0, height: 0, isOptionElement: false };
    }

    const rect = element.getBoundingClientRect();

    return {
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      height: rect.height,
      width: rect.width,
      tag: element.tagName?.toLowerCase(),
    } as IElementRect;
  }

  public get isVisible() {
    const element = this.closestElement;
    if (element) {
      const style = getComputedStyle(element);
      if (style?.visibility === 'hidden') return false;

      const rect = this.boundingClientRect;
      return !!(rect.top || rect.bottom || rect.width || rect.height);
    }
    return false;
  }

  private get isTextNode() {
    return this.objectAtPath?.nodeType === this.objectAtPath?.TEXT_NODE;
  }

  constructor(readonly jsPath: IJsPath) {
    if (!jsPath?.length) return;

    if (jsPath[jsPath.length - 1][0] === stateLookup) {
      this.hasStateLoadRequest = true;
      const lookupCommand = jsPath.pop();
      if (Array.isArray(lookupCommand) && lookupCommand.length > 1) {
        this.stateProperties = lookupCommand[1];
      }
    }
  }

  public lookup() {
    let currentObject: any = window;
    if (this.jsPath[0] === 'window') this.jsPath.shift();
    this.lookupStepIndex = 0;
    for (const step of this.jsPath) {
      this.lookupStep = step;
      if (Array.isArray(step)) {
        const [methodName, ...args] = step;
        currentObject = runMethod(currentObject, methodName, this.lookupStepIndex, args);
      } else if (typeof step === 'number') {
        currentObject = NodeTracker.getNodeWithId(step);
      } else if (typeof step === 'string') {
        currentObject = getProperty(currentObject, step, this.lookupStepIndex);
      } else {
        throw new Error('unknown JsPathStep');
      }
      this.lookupStepIndex += 1;
    }

    this.objectAtPath = currentObject;
    return this;
  }

  public toReturnError(error: Error) {
    // @ts-ignore
    return TSON.stringify({
      error: String(error),
      object: String(this.objectAtPath),
      pathState: {
        step: this.lookupStep,
        index: this.lookupStepIndex,
        path: this.jsPath,
      },
    });
  }

  public extractAttachedState() {
    return ObjectAtPath.createAttachedState(this.objectAtPath, this.stateProperties);
  }

  public static createAttachedState(objectAtPath: any, properties?: string[]) {
    if (!objectAtPath) return null;

    const nodeId = NodeTracker.getNodeId(objectAtPath);
    const state = {
      id: nodeId,
      type: objectAtPath.constructor?.name,
    } as IAttachedState;

    if (isIterableOrArray(objectAtPath)) {
      state.iterableIsCustomType = isCustomType(objectAtPath);
      const objectAsIterable = Array.from(objectAtPath);
      if (state.iterableIsCustomType) {
        state.iterableIds = objectAsIterable.map(x => NodeTracker.getNodeId(x as Node));
      } else {
        state.iterableItems = objectAsIterable;
      }
    }

    for (const prop of properties ?? []) {
      state.properties[prop] = objectAtPath[prop];
    }
    return state;
  }
}

// / JS Path Helpers //////
function isPrimitive(arg) {
  const type = typeof arg;
  return arg == null || (type !== 'object' && type !== 'function');
}

function isCustomType(object) {
  if (
    object instanceof Date ||
    object instanceof ArrayBuffer ||
    object instanceof RegExp ||
    object instanceof Error ||
    object instanceof BigInt ||
    object instanceof String ||
    object instanceof Number ||
    object instanceof Boolean ||
    isPrimitive(object)
  ) {
    return false;
  }
  if (isIterableOrArray(object)) {
    const array = Array.from(object);
    if (array.length) return isCustomType(array[0]);
  }
  return true;
}

function getPropertyAtPath<T>(path: string): T {
  const parts = path.split(/Symbol\(([\w.]+)\)|(?:^|\.)(\w+)|\[(\d+)]/).filter(Boolean);
  let obj: any = window;
  while (parts.length) {
    const next = parts.shift();
    if (next === 'window') continue;
    if (next.startsWith('Symbol.')) {
      obj = obj[Symbol.for(next)];
    } else {
      const parent = obj;
      obj = obj[next];
      if (typeof obj === 'function') obj = obj.bind(parent);
    }
    if (!obj) {
      throw new Error(`Property not found -> ${path}`);
    }
  }
  return obj;
}

function getProperty(object, name, index): unknown {
  if (index === 0 && !object[name]) {
    return getPropertyAtPath(name);
  }
  return object[name] as unknown;
}

function runMethod(object, name, index, args): unknown {
  if (index === 0 && !object[name]) {
    // tslint:disable-next-line:ban-types
    return getPropertyAtPath<Function>(name)(...args);
  }
  // tslint:disable-next-line:ban-types
  return ((object[name] as unknown) as Function).apply(object, args);
}

function isIterableOrArray(object) {
  // don't iterate on strings
  if (!object || typeof object === 'string' || object instanceof String) return false;
  return !!object[Symbol.iterator] || Array.isArray(object);
}

function isPromise(obj) {
  return (
    !!obj &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    typeof obj.then === 'function'
  );
}

// / Node tracker //////

class NodeTracker {
  private static get instance(): INodeTracker {
    return (window as any).nodeTracker;
  }

  public static getNodeWithId(id: number) {
    return this.instance.getNode(id);
  }

  public static getNodeId(node: Node) {
    const id = this.instance.getId(node);
    if (id) return id;
    return this.instance.track(node);
  }
}
