
export class Bitmap {
    private image: HTMLImageElement | OffscreenCanvas;

    constructor(image?: HTMLImageElement, width?: number, height?: number) {
        if (image) {
            this.image = image;
        } else {
            // Если не передано изображение, создаём пустой OffscreenCanvas
            this.image = new OffscreenCanvas(width || 1, height || 1);
        }
    }

    static createBitmap(width: number, height: number): Bitmap {
        return new Bitmap(undefined, width, height);
    }

    static loadBitmap(src: string): Promise<Bitmap> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => resolve(new Bitmap(img));
            img.onerror = (err) => reject(err);
        });
    }

    getCanvas(): OffscreenCanvas | HTMLImageElement {
        return this.image;
    }
    async toImage(): Promise<HTMLImageElement> {
        if (this.image instanceof OffscreenCanvas) {
            const blob = await this.image.convertToBlob({ type: 'image/png' });
            const url = URL.createObjectURL(blob);
            const imgElement = new Image();
            imgElement.src = url;
            return imgElement;
        } else {
            return this.image;
        }
    }


    convertToOffscreenCanvas() {
        if (this.image instanceof HTMLImageElement) {
            const canvas = new OffscreenCanvas(this.image.width, this.image.height);
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(this.image, 0, 0);
            }
            this.image = canvas;
        }
    }

    getPixels(sx:number = 0,sy:number = 0,width?:number,height?:number):ImageData {
        if (this.image instanceof OffscreenCanvas){
            const ctx = this.image.getContext('2d');
            return ctx.getImageData(sx,sy,width||this.image.width,height||this.image.height)
        }
        return null
    }
    setPixels(data:ImageData){
        if (this.image instanceof OffscreenCanvas){
            const ctx = this.image.getContext('2d');
            ctx.putImageData(data,0,0)
        }
    }

    getWidth(): number {
        return this.image.width
    }

    getHeight(): number {
        return this.image.height
    }
}