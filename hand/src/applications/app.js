import { NOT_LOADED, SKIP_BECAUSE_BROKEN, shouldBeActive, LOADING_SOURCE_CODE, NOT_BOOTSTRAPPED, NOT_MOUNTED, BOOTSTRAPPING, MOUNTED } from "./app.helpers";
import { reroute } from "../navigations/reroute";

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

export function getAppChanges() {
    const appsToMount = [];
    const appsToLoad = [];
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