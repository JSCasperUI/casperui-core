export function ArrayToObjectID (array:Array<any>,field:string):Record<string, any> {
    return array.reduce((acc, item) => {
        acc[item[field]] = item;
        return acc;
    }, {});
}
