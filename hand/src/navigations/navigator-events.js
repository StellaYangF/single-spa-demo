// navigator events
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
    if (routingEventsListeningTo.indexOf(eventName) >= 0 
        && capturedEventListeners[eventName].some(listener => listener === fn)
    ) {
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