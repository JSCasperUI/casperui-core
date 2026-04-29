

export interface FilesIDArray {
    name: string;
    fieldId: number|string;
    child: FilesIDArray[];
}

export function IDArrayMake(name:string,fieldId = -1,child = []):FilesIDArray {
   return {name:name,fieldId:fieldId,child};
}


export function LayoutItemMake(name:string,fieldId = "",child = []):FilesIDArray {
    return {name:name,fieldId:fieldId,child};
}
