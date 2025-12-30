export default function createHeifModule() {
  return {
    HeifDecoder: class {
      decode() {
        throw new Error('libheif.wasm assets are missing. Replace /public/heif/* with libheif WASM files.');
      }
    }
  };
}
