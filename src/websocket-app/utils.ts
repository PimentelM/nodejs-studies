

export const tryCatch = <T>(fn: ()=> T) : [err: Error | any, result: T | any]=> {
    try {
        return [null, fn()];
    } catch (e : any) {
        return [e, null];
    }
}

export const handlePromise =  async <T>(promise: Promise<T>) : Promise<[err: Error | any, result: T | any]>=> {
    try {
        return [null, await promise];
    } catch (e : any) {
        return [e, null];
    }
}