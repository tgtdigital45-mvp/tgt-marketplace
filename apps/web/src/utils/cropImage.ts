/**
 * Canvas-based image cropping utility.
 * Takes a base64 image source and crop pixel coordinates from react-easy-crop,
 * returns a cropped Blob ready for upload.
 */

export interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Creates an HTMLImageElement from a source URL (base64 or URL).
 */
const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

/**
 * Crops the image using an offscreen canvas.
 *
 * @param imageSrc - Base64 or URL of the original image
 * @param cropPixels - Pixel coordinates from react-easy-crop's onCropComplete
 * @param outputWidth - Optional max width for the output (defaults to crop width)
 * @returns A JPEG Blob of the cropped area
 */
export async function getCroppedImg(
    imageSrc: string,
    cropPixels: CropArea,
    outputWidth?: number
): Promise<Blob> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Failed to get canvas 2D context');
    }

    // Use output width or original crop dimensions
    const targetWidth = outputWidth || cropPixels.width;
    const scale = targetWidth / cropPixels.width;
    const targetHeight = cropPixels.height * scale;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Draw the cropped area onto the canvas
    ctx.drawImage(
        image,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        targetWidth,
        targetHeight
    );

    // Convert canvas to blob
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Canvas toBlob failed'));
                }
            },
            'image/jpeg',
            0.9
        );
    });
}
