// У heic-decode нет своих типов. Только то, чем пользуемся (render.ts).
declare module 'heic-decode' {
  type DecodedImage = { width: number; height: number; data: Uint8ClampedArray };
  /** Первая картинка файла HEIC в RGBA. */
  export default function decode(input: { buffer: Buffer | Uint8Array }): Promise<DecodedImage>;
}
