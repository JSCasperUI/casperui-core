export class Matrix {
    mMatrix: { _12: number; _31: number; _11: number; _22: number; _21: number; _32: number };
    constructor() {
        this.mMatrix = { _11: 1, _12: 0, _21: 0, _22: 1, _31: 0, _32: 0 };
    }

    static M_TEMPLATE = new Float32Array(6);
    static M_MATRIX = new Matrix();

    identity() {
        this.mMatrix._11 = 1.0;
        this.mMatrix._12 = 0.0;
        this.mMatrix._21 = 0.0;
        this.mMatrix._22 = 1.0;
        this.mMatrix._31 = 0.0;
        this.mMatrix._32 = 0.0;
    }

    transformPoint(x:number, y:number) {
        const { _11, _12, _21, _22, _31, _32 } = this.mMatrix;
        const determinant = _11 * _22 - _12 * _21;
        const invDeterminant = 1.0 / determinant;

        Matrix.M_TEMPLATE[0] = _22 * invDeterminant;
        Matrix.M_TEMPLATE[1] = -_12 * invDeterminant;
        Matrix.M_TEMPLATE[2] = -_21 * invDeterminant;
        Matrix.M_TEMPLATE[3] = _11 * invDeterminant;
        Matrix.M_TEMPLATE[4] = (_21 * _32 - _31 * _22) * invDeterminant;
        Matrix.M_TEMPLATE[5] = (_31 * _12 - _11 * _32) * invDeterminant;

        const xNew = Matrix.M_TEMPLATE[0] * x + Matrix.M_TEMPLATE[2] * y + Matrix.M_TEMPLATE[4];
        const yNew = Matrix.M_TEMPLATE[1] * x + Matrix.M_TEMPLATE[3] * y + Matrix.M_TEMPLATE[5];

        return [xNew, yNew];
    }
    setAll(a:number,b:number,c:number,d:number,e:number,f:number) {
        this.mMatrix._11 = a;
        this.mMatrix._12 = b;
        this.mMatrix._21 = c;
        this.mMatrix._22 = d;
        this.mMatrix._31 = e;
        this.mMatrix._32 = f;
    }
    set(matrix:Matrix) {
        Object.assign(this.mMatrix, matrix.mMatrix);
    }

    setFromArray(m:Float32Array) {
        this.mMatrix._11 = m[0];
        this.mMatrix._12 = m[1];
        this.mMatrix._21 = m[2];
        this.mMatrix._22 = m[3];
        this.mMatrix._31 = m[4];
        this.mMatrix._32 = m[5];
    }

    mul(aa:Matrix, bb:Matrix) {
        const a = aa.mMatrix;
        const b = bb.mMatrix;

        Matrix.M_TEMPLATE[0] = a._11 * b._11 + a._12 * b._21;
        Matrix.M_TEMPLATE[1] = a._11 * b._12 + a._12 * b._22;
        Matrix.M_TEMPLATE[2] = a._21 * b._11 + a._22 * b._21;
        Matrix.M_TEMPLATE[3] = a._21 * b._12 + a._22 * b._22;
        Matrix.M_TEMPLATE[4] = a._31 * b._11 + a._32 * b._21 + b._31;
        Matrix.M_TEMPLATE[5] = a._31 * b._12 + a._32 * b._22 + b._32;

        this.setFromArray(Matrix.M_TEMPLATE);
        return this;
    }

    concat(matrix:Matrix) {
        return this.mul(this, matrix);
    }

    preConcat(matrix:Matrix) {
        return this.mul(matrix, this);
    }

    scale(x: number, y: number, centerX = 0, centerY = 0) {
        Matrix.M_MATRIX.setAll(
            x, 0,
            0, y,
            centerX - x * centerX, centerY - y * centerY
        )
        this.concat(Matrix.M_MATRIX);
    }

    translate(dx: number, dy: number) {

        Matrix.M_MATRIX.setAll(
            1, 0,
            0, 1,
            dx, dy
        )

        this.concat(Matrix.M_MATRIX);
    }

    rotate(angle: number) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        Matrix.M_MATRIX.setAll(
            cos, sin,
            -sin, cos,
            0, 0
        )

        this.concat(Matrix.M_MATRIX);

    }

    skew(kx: number, ky: number) {
        Matrix.M_MATRIX.setAll(
            1, Math.tan(ky),
            Math.tan(kx), 1,
            0, 0
        )

        this.concat(Matrix.M_MATRIX);
    }

    isIdentity() {
        const { _11, _12, _21, _22, _31, _32 } = this.mMatrix;
        return _11 === 1 && _12 === 0 && _21 === 0 && _22 === 1 && _31 === 0 && _32 === 0;
    }

    reset() {
        this.identity();
    }

    toString() {
        const { _11, _12, _21, _22, _31, _32 } = this.mMatrix;
        return `${_11} ${_12} ${_21} ${_22} ${_31} ${_32}`;
    }


    applyToContext(ctx: CanvasRenderingContext2D) {
        ctx.setTransform(
            this.mMatrix._11, this.mMatrix._12,
            this.mMatrix._21, this.mMatrix._22,
            this.mMatrix._31,this.mMatrix._32);
    }
}
