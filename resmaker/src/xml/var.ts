type Token =
    | { type: "text"; value: string }
    | { type: "var"; key: string }
    | { type: "lang"; key: string };

export function parseTemplate(input: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    const pushText = (start: number, end: number) => {
        if (end > start) {
            tokens.push({ type: "text", value: input.slice(start, end) });
        }
    };

    while (i < input.length) {
        // Match @{} for lang
        if (input.startsWith("@{", i)) {
            const end = input.indexOf("}", i + 2);
            if (end !== -1) {
                pushText(i, i);
                const key = input.slice(i + 2, end).trim();
                tokens.push({ type: "lang", key });
                i = end + 1;
                continue;
            }
        }

        // Match {{}} for var
        if (input.startsWith("{{", i)) {
            const end = input.indexOf("}}", i + 2);
            if (end !== -1) {
                pushText(i, i);
                const key = input.slice(i + 2, end).trim();
                tokens.push({ type: "var", key });
                i = end + 2;
                continue;
            }
        }

        // Accumulate plain text
        const nextLang = input.indexOf("@{", i);
        const nextVar = input.indexOf("{{", i);

        let nextSpecial = -1;
        if (nextLang === -1) nextSpecial = nextVar;
        else if (nextVar === -1) nextSpecial = nextLang;
        else nextSpecial = Math.min(nextLang, nextVar);

        if (nextSpecial === -1) {
            pushText(i, input.length);
            break;
        } else {
            pushText(i, nextSpecial);
            i = nextSpecial;
        }
    }

    return tokens;
}
