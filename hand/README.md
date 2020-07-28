# Single-Spa

内部管理多个状态

## 拍平多个数组，返回 promise

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