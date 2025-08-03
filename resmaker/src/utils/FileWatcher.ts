import fs from 'fs';
import path from 'path';


export function watchDirectory(path:string,callback:any){
    console.log("watchDirectory",path);
    fs.watch(path, { recursive: true }, (eventType, filename) => {
        callback(eventType,filename)
    })
        // if (filename) {
        //     const fullPath = path.join(directoryToWatch, filename);
        //     console.log(`Event type: ${eventType}`);
        //     console.log(`File: ${fullPath}`);
        //
        //     // Обработчик для события создания и изменения файла
        //     if (eventType === 'rename') {
        //         fs.stat(fullPath, (err, stats) => {
        //             if (err) {
        //                 // Файл был удален
        //                 console.log(`File ${fullPath} has been removed`);
        //             } else if (stats.isFile()) {
        //                 // Файл был создан или изменен
        //                 console.log(`File ${fullPath} has been added or changed`);
        //             }
        //         });
        //     } else if (eventType === 'change') {
        //         // Файл был изменен
        //         console.log(`File ${fullPath} has been changed`);
        //     }
        // } else {
        //     console.log('filename not provided');
        // }
}
