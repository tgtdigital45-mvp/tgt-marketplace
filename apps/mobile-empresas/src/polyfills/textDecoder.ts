/**
 * TextDecoder polyfill for React Native / Expo.
 *
 * Expo's built-in TextDecoder does NOT support 'utf-16le' encoding,
 * which h3-js requires internally. This polyfill patches globalThis.TextDecoder
 * to add support for utf-16le by decoding UTF-16 LE bytes manually.
 *
 * Must be imported BEFORE any module that uses h3-js.
 */

function decodeUtf16Le(input: BufferSource): string {
    let buffer: ArrayBuffer;

    if (input instanceof ArrayBuffer) {
        buffer = input;
    } else if (ArrayBuffer.isView(input)) {
        // Use Uint8Array to get a guaranteed ArrayBuffer (not SharedArrayBuffer)
        buffer = new Uint8Array(input.buffer, input.byteOffset, input.byteLength).buffer as ArrayBuffer;
    } else {
        return '';
    }

    const view = new DataView(buffer);
    let result = '';
    for (let i = 0; i + 1 < view.byteLength; i += 2) {
        result += String.fromCharCode(view.getUint16(i, true)); // true = little endian
    }
    return result;
}

const UTF16_ENCODINGS = new Set(['utf-16le', 'utf16le', 'ucs-2', 'ucs2', 'unicode-1-1-utf-16']);

if (typeof globalThis !== 'undefined' && typeof globalThis.TextDecoder !== 'undefined') {
    const NativeTextDecoder = globalThis.TextDecoder;

    // Check if native TextDecoder already supports utf-16le
    let nativeSupportsUtf16Le = false;
    try {
        new NativeTextDecoder('utf-16le');
        nativeSupportsUtf16Le = true;
    } catch {
        nativeSupportsUtf16Le = false;
    }

    if (!nativeSupportsUtf16Le) {
        // Minimal wrapper that adds utf-16le support
        function PatchedTextDecoder(
            this: { _enc: string; _native: InstanceType<typeof NativeTextDecoder> | null },
            encoding?: string,
            options?: TextDecoderOptions
        ) {
            const enc = (encoding ?? 'utf-8').toLowerCase();
            this._enc = enc;
            if (UTF16_ENCODINGS.has(enc)) {
                this._native = null;
            } else {
                this._native = new NativeTextDecoder(encoding, options);
            }
        }

        PatchedTextDecoder.prototype.decode = function (
            this: { _enc: string; _native: InstanceType<typeof NativeTextDecoder> | null },
            input?: BufferSource,
            options?: TextDecodeOptions
        ): string {
            if (this._native) {
                return this._native.decode(input, options);
            }
            if (!input) return '';
            return decodeUtf16Le(input);
        };

        Object.defineProperty(PatchedTextDecoder.prototype, 'encoding', {
            get(this: { _enc: string }) { return this._enc; },
            configurable: true,
        });

        Object.defineProperty(PatchedTextDecoder.prototype, 'fatal', {
            get() { return false; },
            configurable: true,
        });

        Object.defineProperty(PatchedTextDecoder.prototype, 'ignoreBOM', {
            get() { return false; },
            configurable: true,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any).TextDecoder = PatchedTextDecoder;
    }
}

export { };
