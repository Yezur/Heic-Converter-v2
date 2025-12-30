export const __HEIF_PLACEHOLDER__ = true;

const createHeifModule = () => ({
  HeifDecoder: class {
    decode() {
      throw new Error('libheif.wasm assets are missing. Replace /public/heif/* with libheif WASM files.');
    }
  }
});

createHeifModule.__HEIF_PLACEHOLDER__ = true;

export default createHeifModule;
