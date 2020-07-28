import { started } from "../start";
import { getAppChanges } from "../applications/app";
import { toLoadPromise } from "../lifecycles/load";
import { toUnmountPromise } from "../lifecycles/unmount";
import { toBootstrapPromise } from "../lifecycles/bootstrap";
import { toMountPromise } from "../lifecycles/mount";
import './navigator-events';

// 核心处理应用
export function reroute() {

    // 1. 获取要加载的应用 NOT_LOADED
    // 2. 获取要被挂载的应用 NOT_MOUNTED
    // 3. 获取要被卸载的应用
    const { appsToMount, appsToLoad, appsToUnmount } = getAppChanges();

    // start 方法调用时，是同步的
    // 加载流程是异步的
    if (started) {
        // app 装载
        console.log('调用 start');
        return performAppChanges(); // 根据路径来装载应用
    } else {
        // 注册应用，预先加载
        // 获取 bootstrap, mount, unmount 放到 app 上
        return loadApps();
    }
    async function loadApps() {
        let apps = await Promise.all(appsToLoad.map(toLoadPromise));
    }
    async function performAppChanges() {
        // 1. 先卸载不需要的应用
        // 2. 加载需要的应用
        let unmountPromises = appsToUnmount.map(toUnmountPromise);
        // 需要加载，但路径不匹配 /app2
        appsToLoad.map(async (app) => {
            // 依次加载、启动、挂载 要加载的应用
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