export interface TSV {
    table:Record<string, string>[]
    key:string,
    languages:string[]
}
export function parseTsv(data: string):TSV {
    const lines = data.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length === 0) return {} as TSV;

    const headers = lines[0].split("\t");

    let out = {} as TSV
    out.key = headers[0];
    out.languages = headers.slice(1);
    out.table = lines.slice(1).map(line => {
        const values = line.split("\t");
        const obj: Record<string, string> = {};
        for (let i = 0; i < headers.length; i++) {
            obj[headers[i]] = values[i] ?? "";
        }
        return obj;
    });

    return out
}
