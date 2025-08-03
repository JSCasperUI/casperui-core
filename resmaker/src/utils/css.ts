
export function minifyCSS(css:string):string {
    css = css.replace(/\/\*[\s\S]*?\*\//g, '');
    css = css.replace(/\s*({|}|:|;|,)\s*/g, '$1');
    css = css.replace(/\s\s+/g, ' ');
    css = css.replace(/^\s+|\s+$/g, '');
    return css;
}

