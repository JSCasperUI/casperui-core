
export class Rect {
    mLeft = 0
    mTop = 0
    mRight = 0
    mBottom = 0

    constructor(left: number, top: number, right: number, bottom: number) {
        this.mLeft = left
        this.mTop = top
        this.mRight = right
        this.mBottom = bottom
    }


    setAll(value: number) {
        this.mLeft = value
        this.mTop = value
        this.mRight = value
        this.mBottom = value
    }

    setUpDown(value: number) {
        this.mTop = value
        this.mBottom = value
    }

    setLeftRight(value: number) {
        this.mLeft = value
        this.mRight = value
    }

    setByIndex(index: number, value: number) {
        switch (index) {
            case 1: this.mLeft = value; break;
            case 2: this.mTop = value; break;
            case 3: this.mRight = value; break;
            case 4: this.mBottom = value; break;
        }
    }


    getWidth(): number {
        return this.mRight - this.mLeft
    }

    getHeight(): number {
        return this.mBottom - this.mTop
    }

    width(width: number): number {
        this.mRight = this.mLeft + width
        return this.mRight
    }

    height(height: number): number {
        this.mBottom = this.mTop + height
        return this.mBottom
    }

    set(left: number, top: number, right: number, bottom: number) {
        this.mLeft = left
        this.mTop = top
        this.mRight = right
        this.mBottom = bottom
    }


    clipClamp(left: number, top: number, right: number, bottom: number){
        this.mLeft = Math.max(this.mLeft,left)
        this.mTop = Math.max(this.mTop,top)
        this.mRight = Math.min(this.mRight,right)
        this.mBottom = Math.min(this.mBottom,bottom)
    }
    setRect(rect: Rect) {
        this.mLeft = rect.mLeft
        this.mTop = rect.mTop
        this.mRight = rect.mRight
        this.mBottom = rect.mBottom
    }

    isZero(): Boolean {
        return (this.mLeft == 0 && this.mTop == 0 && this.mRight == 0 && this.mBottom == 0)
    }

    isEmpty(): Boolean {
        return this.mLeft >= this.mRight || this.mTop >= this.mBottom
    }

    equals(rect: Rect): Boolean {
        return (this.mLeft == rect.mLeft && this.mTop == rect.mTop && this.mRight == rect.mRight && this.mBottom == rect.mBottom)
    }

    eq(rect: Rect): Boolean {
        return (this.mLeft == rect.mLeft && this.mTop == rect.mTop && this.mRight == rect.mRight && this.mBottom == rect.mBottom)
    }

    match(left: number, top: number, right: number, bottom: number): Boolean {
        return (this.mLeft == left && this.mTop == top && this.mRight == right && this.mBottom == bottom)
    }

    reset() {
        this.mLeft = 0
        this.mTop = 0
        this.mRight = 0
        this.mBottom = 0
    }

    toString(): string {
        return "$mLeft $mTop $mRight $mBottom "
    }

    hashCode(): number {
        var result = this.mLeft
        result = 31 * result + this.mTop
        result = 31 * result + this.mRight
        result = 31 * result + this.mBottom
        return result
    }

}
