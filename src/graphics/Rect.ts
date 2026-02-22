export class Rect {
    left = 0
    top = 0
    right = 0
    bottom = 0

    constructor(left: number, top: number, right: number, bottom: number) {
        this.left = left
        this.top = top
        this.right = right
        this.bottom = bottom
    }

    getPoint(): Point {
        return {x: this.left, y: this.top}
    }


    setAll(value: number) {
        this.left = value
        this.top = value
        this.right = value
        this.bottom = value
    }

    setUpDown(value: number) {
        this.top = value
        this.bottom = value
    }

    setLeftRight(value: number) {
        this.left = value
        this.right = value
    }

    setByIndex(index: number, value: number) {
        switch (index) {
            case 1:
                this.left = value;
                break;
            case 2:
                this.top = value;
                break;
            case 3:
                this.right = value;
                break;
            case 4:
                this.bottom = value;
                break;
        }
    }


    getWidth(): number {
        return this.right - this.left
    }

    getHeight(): number {
        return this.bottom - this.top
    }

    width(width: number): number {
        this.right = this.left + width
        return this.right
    }

    height(height: number): number {
        this.bottom = this.top + height
        return this.bottom
    }

    set(left: number, top: number, right: number, bottom: number) {
        this.left = left
        this.top = top
        this.right = right
        this.bottom = bottom
    }


    clipClamp(left: number, top: number, right: number, bottom: number) {
        this.left = Math.max(this.left, left)
        this.top = Math.max(this.top, top)
        this.right = Math.min(this.right, right)
        this.bottom = Math.min(this.bottom, bottom)
    }

    setRect(rect: Rect) {
        this.left = rect.left
        this.top = rect.top
        this.right = rect.right
        this.bottom = rect.bottom
    }

    isZero(): Boolean {
        return (this.left == 0 && this.top == 0 && this.right == 0 && this.bottom == 0)
    }

    isEmpty(): Boolean {
        return this.left >= this.right || this.top >= this.bottom
    }

    equals(rect: Rect): Boolean {
        return (this.left == rect.left && this.top == rect.top && this.right == rect.right && this.bottom == rect.bottom)
    }

    eq(rect: Rect): Boolean {
        return (this.left == rect.left && this.top == rect.top && this.right == rect.right && this.bottom == rect.bottom)
    }

    match(left: number, top: number, right: number, bottom: number): Boolean {
        return (this.left == left && this.top == top && this.right == right && this.bottom == bottom)
    }

    reset() {
        this.left = 0
        this.top = 0
        this.right = 0
        this.bottom = 0
    }

    toString(): string {
        return "Rect( $mLeft $mTop $mRight $mBottom )"
    }

    hashCode(): number {
        var result = this.left
        result = 31 * result + this.top
        result = 31 * result + this.right
        result = 31 * result + this.bottom
        return result
    }

}
