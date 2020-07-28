import { LOADING_SOURCE_CODE, NOT_BOOTSTRAPPED } from "../applications/app.helpers";

function flattenFnArray(fns) {
    fns = Array.isArray(fns) ? fns: [fns];
    return function(props) {
        return fns.reduce((p,fn) => p.then(() => fn(props)), Promise.resolve())
    }
}

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

