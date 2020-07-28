# Single-Spa

内部管理多个状态

## 核心方法

* registerApplication
* app.helper
* start
* reroute
* lifecycles
* flattenFnArray
* hijack route

## usage

```js
import singleSpa from 'single-spa';

singleSpa.registerApplication(
    'app1', 
    async () => {
        return {
            bootstrap: async () => {},
            mount: async () => {},
            unmount: async () => {},
        };
    },
    location => location.hash.startsWith('#app1'),
    {
        store: {
            name: 'Stella'
        }
    }
);
singleSpa.start();
```

## registerApplication

注册应用，接受参数:
* appName: 应用名称 app1
* loadApp: 加载函数，执行后需要返回三个钩子函数(可以是数组也可以是函数，内部会进行拍平处理)
    * bootstrap
    * mount
    * unmount
* activeWhen: 应用激活函数，路径匹配时的函数
* customProps: 自定义选项，可传递给内部的

```js
const apps = [];

export function registerApplication(appName, loadApp, activeWhen, customProps) {
    apps.push({
        name: appName,
        loadApp,
        activeWhen,
        customProps,
        status: NOT_LOADED,
    });
    reroute(); // 加载应用
}

// getAppChanges
export function getAppChanges() {
    const appsToLoad = [];
    const appsToMount = [];
    const appsToUnmount = [];
    apps.forEach(app => {
        const appShouldBeActive = app.status !== SKIP_BECAUSE_BROKEN && shouldBeActive(app);
        switch(app.status) {
            case NOT_LOADED: 
            case LOADING_SOURCE_CODE:
                if (shouldBeActive) {
                    appsToLoad.push(app);
                }
                break;
            case BOOTSTRAPPING:
            case NOT_BOOTSTRAPPED:
            case NOT_MOUNTED:
                if (appShouldBeActive) {
                    appsToMount.push(app);
                }
                break;
            case MOUNTED:
                if (!appShouldBeActive) {
                    appsToUnmount.push(app);
                }
        }
    })
}
```

## app.helper

```js
export const NOT_LOADED = 'NOT_LOADED'; // 应用初始状态
export const LOADING_SOURCE_CODE = 'LOADING_SOURCE_CODE'; // 加载资源
export const NOT_BOOTSTRAPPED = 'NOT_BOOTSTRAPPED'; // 还没调用 bootstrap 方法
export const BOOTSTRAPPING  = 'BOOTSTRAPPING';// 启动中
export const NOT_MOUNTED  = 'NOT_MOUNTED'; // 没调用 mount 方法
export const MOUNTING  = 'MOUNTING'; // 挂载中
export const MOUNTED  = 'MOUNTED'; // 挂载完毕
export const UPDATING  = 'UPDATING'; // 更新中
export const UNMOUNTING  = 'UNMOUNTING'; // 接触挂载
export const UNLOADING  = 'UNLOADING'; // 完全卸载中
export const LOAD_ERROR  = 'LOAD_ERROR';
export const SKIP_BECAUSE_BROKEN  = 'SKIP_BECAUSE_BROKEN'; 

// 当前应用是否被激活 
export function isActive(app) {
    return app.status === MOUNTED;
}
// 是否要被激活
export function shouldBeActive(app) {
    return app.activeWhen(window.location);
}
```

## start method

用户注册执行完后，可手动执行 start 函数，加载或挂载对应应用

```js
import { reroute } from './navigations/reroute';

export let started  = false;

export function start() {
    started = true;
    reroute();
}
```

## reroute

```js
import { started } from "../start";
import { getAppChanges } from "../applications/app";
import { toLoadPromise } from "../lifecycles/load";
import { toUnmountPromise } from "../lifecycles/unmount";
import { toBootstrapPromise } from "../lifecycles/bootstrap";
import { toMountPromise } from "../lifecycles/mount";
import './navigator-events';

export function reroute() {

    const { appsToMount, appsToLoad, appsToUnmount } = getAppChanges();

    if (started) {
        return performAppChanges();
    } else {
        // register & preload app 
        // add bootstrap, mount, unmount to app
        return loadApps();
    }
    async function loadApps() {
        let apps = await Promise.all(appsToLoad.map(toLoadPromise));
    }
    async function performAppChanges() {
        let unmountPromises = appsToUnmount.map(toUnmountPromise);
        appsToLoad.map(async (app) => {
            app = await toLoadPromise(app);
            app = await toBootstrapPromise(app);
            return await toMountPromise(app);
        })
        appsToMount.map(async app => {
            app = await toBootstrapPromise(app);
            return toMountPromise(app);
        })
    }
}
```

## lifecycles

### bootstrap

```js
import { NOT_BOOTSTRAPPED, BOOTSTRAPPING, NOT_MOUNTED } from "../applications/app.helpers";

export async function toBootstrapPromise(app) {
    if (app.status !== NOT_BOOTSTRAPPED) return app;
    app.status = BOOTSTRAPPING;
    await app.bootstrap(app.customProps);
    app.status = NOT_MOUNTED;
    return app;
}
```

### load

```js
import { LOADING_SOURCE_CODE, NOT_BOOTSTRAPPED } from "../applications/app.helpers";

export async function toLoadPromise(app) {
    // 避免start 调用两次
    // 缓存
    if (app.loadPromise) {
        return app.loadPromise;
    }
    return (app.loadPromise = Promise.resolve().then(async () => {
        app.status = LOADING_SOURCE_CODE;
        let { bootstrap, mount, unmount } = await app.loadApp(app.customProps);
        app.status = NOT_BOOTSTRAPPED;
        // 将用户传入的 bootstrap 函数数组拍平为一个高阶函数，
        app.bootstrap = flattenFnArray(bootstrap);
        app.mount = flattenFnArray(mount);
        app.unmount = flattenFnArray(unmount);
        delete app.loadPromise;
        return app;
    }))
}

```

### mount

```js
import { NOT_MOUNTED, MOUNTING, MOUNTED } from "../applications/app.helpers";

export async function toMountPromise(app) {
    if (app.status !== NOT_MOUNTED) return app;
    app.status = MOUNTING;
    await app.mount(app.customProps);
    app.status = MOUNTED;
    return app;
}
```

### unmount
```js
import { MOUNTED, UNMOUNTING, NOT_MOUNTED } from "../applications/app.helpers";

export async function toUnmountPromise(app) {
    if (app.status !== MOUNTED) {
        return app;
    }
    app.status = UNMOUNTING;
    await app.unmount(app.customProps);
    app.status = MOUNTED;
    return app;
}
```

## 拍平多个数组 flattenFnArray

```js
function flattenFnArray(fns) {
    fns = Array.isArray(fns) ? fns: [fns];
    return function(props) {
        return fns.reduce((p,fn) => p.then(() => fn(props)), Promise.resolve())
    }
}
```

## 路由拦截

路径变化，加载对应的应用

监听下面的事件：（重写，保留原来的函数）

* hashChange
* popstate 只针对浏览器切换（前进后退），触发 H5 API 需重写


引用切换后，需要处理原来的方法，应用切换后再执行：

```js
// navigator-events
import { reroute } from './reroute';

export const routingEventsListeningTo = ['hashchange', 'popstate'];

function urlReroute() {
    // path to load the specific app
    reroute([], arguments);
}

const capturedEventListeners = {
    hashchange: [],
    popstate: [],
}
const originalAddEventListener = window.addEventListener;
const originalRemoveEventLister = window.removeEventListener;

window.addEventListener = function (eventName, fn) {
    // hijack events
    if (routingEventsListeningTo.indexOf(eventName) >= 0 && capturedEventListeners[eventName].some(listener => listener === fn)) {
        capturedEventListeners[eventName].push(fn);
        return;
    }
    return originalAddEventListener.apply(this, arguments);
}
window.removeEventListener = function (eventName, fn) {
    if (routingEventsListeningTo.indexOf(eventName) >= 0) {
        capturedEventListeners[eventName] = capturedEventListeners[eventName].filter(l => l !== fn);
        return;
    }
    return originalRemoveEventLister.apply(this, arguments);
}

window.addEventListener('hashchange', urlReroute);
window.addEventListener('popstate', urlReroute);

function patchedUpdateState(updateState, methodName) {
    return function () {
        const urlBefore = window.location.href;
        updateState.apply(this, arguments); // original method
        const urlAfter = window.location.href;
        if (urlBefore !== urlAfter) {
            // reload app to transfer event source
            urlReroute(new PopStateEvent('popstate'));
        }
    }
}

window.history.pushState = patchedUpdateState(window.history.pushState, 'pushState');
window.history.replaceState = patchedUpdateState(window.history.replaceState, 'replaceState');
```

满足应用加载最先处理