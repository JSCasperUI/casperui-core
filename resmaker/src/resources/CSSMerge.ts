import fs from 'fs';
import path from 'path';

// Функция для конвертации числа в Base64 VLQ
function toVLQ(num: number): string {
    let vlq = '';
    let value = (num < 0 ? ((-num) << 1) | 1 : num << 1);

    do {
        let digit = value & 31;
        value >>= 5;
        if (value > 0) {
            digit |= 32;
        }
        vlq += 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.charAt(digit);
    } while (value > 0);

    return vlq;
}

export class CSSMerge {
    private sourceRoot: string;
    private files: any[];
    constructor() {
        this.files = [];
        this.sourceRoot = "/source/";  // Корневая директория для исходных файлов
    }

    addCSS(cssFilePath:string) {
        if (fs.existsSync(cssFilePath)) {
            this.files.push(cssFilePath);
        } else {
            throw new Error(`File not found: ${cssFilePath}`);
        }
    }


    compileOutput(filename:string) {
        if (!filename) return;

        let cssContent = '';
        let mappings = '';
        const sourcesContent:any[] = [];

        // Инициализация для отслеживания предыдущих значений
        let previousGeneratedColumn = 0;
        let previousSourceIndex = 0;
        let previousSourceLine = 0;
        let previousSourceColumn = 0;

        this.files.forEach((filePath, sourceIndex) => {
            const content = fs.readFileSync(filePath, 'utf-8');
            sourcesContent.push(content);
            const lines = content.split('\n');
            cssContent += content + '\n';

            // @ts-ignore
            lines.forEach((_, lineIndex) => {
                if (lineIndex > 0 || mappings) mappings += ';'; // Переход на новую строку в `mappings`

                const segment = [
                    toVLQ(0 - previousGeneratedColumn),  // Колонка в скомпилированном файле
                    toVLQ(sourceIndex - previousSourceIndex),  // Индекс исходного файла
                    toVLQ(lineIndex - previousSourceLine),     // Строка в исходном файле
                    toVLQ(0 - previousSourceColumn)            // Колонка в исходном файле (0 для всех строк)
                ];

                mappings += segment.join('');

                previousGeneratedColumn = 0;
                previousSourceIndex = sourceIndex;
                previousSourceLine = lineIndex;
                previousSourceColumn = 0;
            });
        });

        const sourceMap = {
            version: 3,
            file: filename,
            sources: this.files.map(filePath => path.relative(process.cwd(), filePath)),
            sourcesContent: sourcesContent,
            mappings: mappings,
            sourceRoot: this.sourceRoot,
        };

        return {
            cssContent: cssContent + `\n/*# sourceMappingURL=${filename}.map */`,
            sourceMap: JSON.stringify(sourceMap, null, 2),
        };
    }
}

