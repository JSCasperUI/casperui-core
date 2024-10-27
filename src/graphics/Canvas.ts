import {Paint} from "@casperui/core/graphics/Paint";
import {Rect} from "@casperui/core/graphics/Rect";
import {Matrix} from "@casperui/core/graphics/Matrix";
import {Bitmap} from "@casperui/core/graphics/Bitmap";
import {View} from "@casperui/core/view/View";

export class Canvas {
    private mElement: HTMLCanvasElement | OffscreenCanvas;
     ctx2D: CanvasRenderingContext2D

    private mMatrix = new Matrix();
    private mTR1 = new Rect(0,0,0,0);
    private mTR2 = new Rect(0,0,0,0);

    constructor(element?: HTMLCanvasElement | Bitmap | View) {
        if (element && element instanceof HTMLCanvasElement) {
            this.mElement = element
        } else if (element instanceof View) {
            this.mElement = element.getElement() as HTMLCanvasElement
        } else if (element instanceof Bitmap) {
            let gCanvas = element.getCanvas();
            if (!(gCanvas instanceof OffscreenCanvas)) {
                throw Error("Need Bitmap.convertToOffscreenCanvas")
            }
            this.mElement = gCanvas as OffscreenCanvas;
        } else {
            this.mElement = document.createElement("canvas");
        }
        this.ctx2D = (this.mElement  as HTMLCanvasElement).getContext('2d');
    }

    setCanvasWidth(width: number) {
        this.mElement.width = width;
    }

    setCanvasHeight(height: number) {
        this.mElement.height = height;
    }


    getCanvasWidth(): number {
        return this.mElement.width;
    }

    getCanvasHeight(): number {
        return this.mElement.height;
    }

    clear() {
        this.ctx2D.clearRect(0, 0, this.mElement.width, this.mElement.height);
    }

    // Начало отсечения
    clipStart(rect: Rect) {
        this.ctx2D.save();
        this.ctx2D.beginPath();
        this.ctx2D.rect(rect.mLeft, rect.mTop, rect.getWidth(), rect.getHeight()); // Определяем область отсечения
        this.ctx2D.clip();
    }

    // Конец отсечения
    clipEnd() {
        this.ctx2D.restore();
    }

    start() {
        this.ctx2D.save();
        this.mMatrix.applyToContext(this.ctx2D);
    }

    end() {
        this.ctx2D.restore();
    }

    // Применение текущей матрицы к контексту
    applyTransformations() {
        this.mMatrix.applyToContext(this.ctx2D);
    }

    resetTransformations() {
        this.mMatrix.identity();
        this.applyTransformations();
    }

    translate(dx: number, dy: number) {
        this.mMatrix.translate(dx, dy);
        this.applyTransformations();
    }

    scale(sx: number, sy: number) {
        this.mMatrix.scale(sx, sy);
        this.applyTransformations();
    }

    rotate(angle: number) {

        this.mMatrix.rotate(angle)
        this.applyTransformations();
    }

    transform(matrix: Matrix) {
        this.mMatrix.concat(matrix);
        this.applyTransformations();
    }

    preTransform(matrix: Matrix) {
        this.mMatrix.preConcat(matrix); // умножение новой матрицы на текущую
        this.applyTransformations(); // применяем обновленную матрицу к контексту
    }


    drawBitmap(bitmap: Bitmap, paint: Paint, dst: Rect, src?: Rect): void {
        paint.applyToContext(this.ctx2D);

        if (src) {
            this.ctx2D.drawImage(
                bitmap.getCanvas(),
                src.mLeft,
                src.mTop,
                src.getWidth(),
                src.getHeight(),
                dst.mLeft,
                dst.mTop,
                dst.getWidth(),
                dst.getHeight()
            );
        } else {
            this.ctx2D.drawImage(
                bitmap.getCanvas(),
                dst.mLeft,
                dst.mTop,
                dst.getWidth(),
                dst.getHeight()
            );
        }
    }

    drawRoundRect(rect: Rect, rx: number, ry: number, paint: Paint) {
        paint.applyToContext(this.ctx2D)
        this.ctx2D.beginPath();
        this.ctx2D.moveTo(rect.mLeft + rx, rect.mTop);
        this.ctx2D.lineTo(rect.mRight - rx, rect.mTop);
        this.ctx2D.quadraticCurveTo(rect.mRight, rect.mTop, rect.mRight, rect.mTop + ry);
        this.ctx2D.lineTo(rect.mRight, rect.mBottom - ry);
        this.ctx2D.quadraticCurveTo(rect.mRight, rect.mBottom, rect.mRight - rx, rect.mBottom);
        this.ctx2D.lineTo(rect.mLeft + rx, rect.mBottom);
        this.ctx2D.quadraticCurveTo(rect.mLeft, rect.mBottom, rect.mLeft, rect.mBottom - ry);
        this.ctx2D.lineTo(rect.mLeft, rect.mTop + ry);
        this.ctx2D.quadraticCurveTo(rect.mLeft, rect.mTop, rect.mLeft + rx, rect.mTop);
        this.ctx2D.closePath();
        if (paint.isFill) this.ctx2D.fill();
        if (paint.isStroke) this.ctx2D.stroke();

    }
    drawRectC(left: number, top: number, right: number, bottom: number, paint: Paint){
        this.mTR1.set(left, top, right, bottom)
        this.drawRect(this.mTR1,paint)
    }
    drawRect(rect: Rect, paint: Paint) {
        paint.applyToContext(this.ctx2D)
        if (paint.isFill)
            this.ctx2D.fillRect(rect.mLeft, rect.mTop, rect.getWidth(), rect.getHeight());
        if (paint.isStroke)
            this.ctx2D.strokeRect(rect.mLeft, rect.mTop, rect.getWidth(), rect.getHeight());
    }

    drawEllipse(cx: number, cy: number, rx: number, ry: number, paint: Paint) {
        paint.applyToContext(this.ctx2D)
        this.ctx2D.beginPath();
        this.ctx2D.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        if (paint.isFill) this.ctx2D.fill();
        if (paint.isStroke) this.ctx2D.stroke();

    }

    drawLine(sx: number, sy: number, ex: number, ey: number, paint: Paint) {
        paint.applyToContext(this.ctx2D)
        this.ctx2D.beginPath();
        this.ctx2D.moveTo(sx, sy);
        this.ctx2D.lineTo(ex, ey);
        if (paint.isFill) this.ctx2D.fill();
        if (paint.isStroke) this.ctx2D.stroke();
    }
    drawHardLine(sx: number, sy: number, ex: number, ey: number, paint: Paint) {
        paint.applyToContext(this.ctx2D)
        this.ctx2D.beginPath();
        this.ctx2D.moveTo(sx+0.5, sy+0.5);
        this.ctx2D.lineTo(ex+0.5, ey+0.5);
        if (paint.isFill) this.ctx2D.fill();
        if (paint.isStroke) this.ctx2D.stroke();
    }

    drawPath(path: Path2D, paint: Paint) {
        paint.applyToContext(this.ctx2D)
        if (paint.isFill) this.ctx2D.fill(path);
        if (paint.isStroke) this.ctx2D.stroke(path);
    }

    drawText(text: string, x: number, y: number, paint: Paint) {
        paint.applyToContext(this.ctx2D)
        if (paint.isFill) this.ctx2D.fillText(text, x, y);
        if (paint.isStroke) this.ctx2D.strokeText(text, x, y);
    }
    resetMatrix(){
        this.mMatrix.identity(); // умножение новой матрицы на текущую
        this.applyTransformations(); // применяем обновленную матрицу к контексту
    }
    antiAlias(enable:boolean){
        this.ctx2D.imageSmoothingEnabled = enable
    }
}