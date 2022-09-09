

export const tryCatch = (fn: Function) : [err: Error | any, result: any]=> {
    try {
        return [null, fn()];
    } catch (e : any) {
        return [e, null];
    }
}