const fs = require('fs');
const path = require('path');

// Функция для конвертации числа в Base64 VLQ
function toVLQ(num) {
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

class CSSMerge {
    constructor() {
        this.files = [];
        this.sourceRoot = "/source/";  // Корневая директория для исходных файлов
    }

    addCSS(cssFilePath) {
        if (fs.existsSync(cssFilePath)) {
            this.files.push(cssFilePath);
        } else {
            throw new Error(`File not found: ${cssFilePath}`);
        }
    }

    /**
     * Компилирует объединенный CSS и создает source map с точным сопоставлением строк и файлов
     * @return {{cssContent: string, sourceMap: string}} - объединённый CSS и source map
     */
    compileOutput(filename) {
        if (!filename) return;

        let cssContent = '';
        let mappings = '';
        const sourcesContent = [];

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

            // Генерация `mappings` для каждой строки файла
            lines.forEach((_, lineIndex) => {
                if (lineIndex > 0 || mappings) mappings += ';'; // Переход на новую строку в `mappings`

                // Сегмент указывает: колонка скомпилированного файла, индекс файла, строка файла, колонка исходного файла
                const segment = [
                    toVLQ(0 - previousGeneratedColumn),  // Колонка в скомпилированном файле
                    toVLQ(sourceIndex - previousSourceIndex),  // Индекс исходного файла
                    toVLQ(lineIndex - previousSourceLine),     // Строка в исходном файле
                    toVLQ(0 - previousSourceColumn)            // Колонка в исходном файле (0 для всех строк)
                ];

                mappings += segment.join('');

                // Обновление предыдущих значений для следующего сегмента
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

module.exports.CSSMerge = CSSMerge;
