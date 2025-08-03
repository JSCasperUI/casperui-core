

export interface FilesIDArray {
    name: string;
    fieldId: number;
    child: FilesIDArray[];
}

export function IDArrayMake(name:string,fieldId = -1,child = []):FilesIDArray {
   return {name:name,fieldId:fieldId,child};
}
