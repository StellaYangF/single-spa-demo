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