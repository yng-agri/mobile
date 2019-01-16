export class AndroidUtils {
    static toNativeArr<T>(arr: T[], type: any): native.Array<T> {
        const nArr = Array.create(type, arr.length);
        arr.forEach((v, i) => nArr[i] = v);
        return nArr;
    }
}
