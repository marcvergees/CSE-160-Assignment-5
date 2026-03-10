export class StringToNumberHelper {
    constructor(obj, prop) {
        this.obj = obj;
        this.prop = prop;
    }
    get value() {
        return this.obj[this.prop];
    }
    set value(v) {
        this.obj[this.prop] = parseFloat(v);
    }
}