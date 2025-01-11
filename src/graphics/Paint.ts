function parseColor(colorString) {
    if (colorString.startsWith('#')) {
        colorString = colorString.slice(1);
    }

    if (colorString.length === 6) {
        colorString = 'FF' + colorString;  // Добавляем FF (полностью непрозрачный)
    }

    const colorInt = parseInt(colorString, 16);
    return colorInt;
}
export class Paint {
    static readonly FILL = 1;
    static readonly STROKE = 2;
    static readonly FILL_AND_STROKE = 3;

    private mOpacity = 1.0
    private mFillColor = "#000000"
    private mStrokeColor =  "#000000"
    private mStrokeWith = 1.0
    private mStyle = 1
    private mFontSize = 18

    constructor(style?:number) {
        if (style){
            this.setStyle(style)
        }
    }



    isFill = false
    isStroke = false

    setStrokeColor(color: number|string){
        if (typeof color === "string"){
            this.mStrokeColor = color
        }else{
            // this.mStrokeColor = color
        }

    }
    setFillColor(color: string){
        this.mFillColor = color
    }
    setStyle(style:number){
        this.mStyle = style

        this.isFill = (style & Paint.FILL) !== 0
        this.isStroke = (style & Paint.STROKE) !== 0

    }




    getStyle():number{
        return this.mStyle
    }
    setStrokeWidth(width:number){
        this.mStrokeWith = width
    }
    getStrokeWidth():number{
        return this.mStrokeWith
    }

    getFillColor(): string {
        return this.mFillColor
    }
    getStrokeColor(): string {
        return this.mStrokeColor
    }

    applyToContext(ctx: CanvasRenderingContext2D){
        ctx.globalAlpha = this.mOpacity;
        if (this.isFill) {
            ctx.fillStyle = this.mFillColor;
        }
        ctx.font = "18px serif";

        if (this.isStroke) {
            ctx.strokeStyle = this.mStrokeColor;
            ctx.lineWidth = this.mStrokeWith;
        }
    }
}