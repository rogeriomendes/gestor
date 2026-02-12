/**
 * Decodifica DOCXML (blob/Buffer serializado) para string UTF-8.
 * Suporta os formatos que podem vir da API:
 * - Objeto com índices numéricos (ex.: Buffer serializado como { 0: n, 1: n, ... })
 * - Array de números
 * - { type: "Buffer", data: number[] }
 * - Uint8Array
 */
export function decodeDocXml(blobObj: unknown): string | null {
  if (blobObj == null) {
    return null;
  }

  try {
    // Array de números
    if (Array.isArray(blobObj)) {
      if (blobObj.length === 0) {
        return null;
      }
      return new TextDecoder("utf-8").decode(
        Uint8Array.from(blobObj as number[])
      );
    }

    // Uint8Array
    if (blobObj instanceof Uint8Array) {
      if (blobObj.length === 0) {
        return null;
      }
      return new TextDecoder("utf-8").decode(blobObj);
    }

    // Buffer serializado: { type: "Buffer", data: number[] }
    if (
      typeof blobObj === "object" &&
      "data" in blobObj &&
      Array.isArray((blobObj as { data: number[] }).data)
    ) {
      const data = (blobObj as { type: string; data: number[] }).data;
      if (data.length === 0) {
        return null;
      }
      return new TextDecoder("utf-8").decode(Uint8Array.from(data));
    }

    // Objeto com índices numéricos (ex.: { 0: n, 1: n, ... })
    if (typeof blobObj === "object" && blobObj !== null && "0" in blobObj) {
      const keys = Object.keys(blobObj)
        .map((k) => Number(k))
        .filter((n) => !Number.isNaN(n));
      if (keys.length === 0) {
        return null;
      }
      const maxIndex = Math.max(...keys);
      const bytes = new Uint8Array(maxIndex + 1);
      const obj = blobObj as Record<number, number>;
      for (let i = 0; i <= maxIndex; i++) {
        if (obj[i] !== undefined) {
          bytes[i] = obj[i];
        }
      }
      return new TextDecoder("utf-8").decode(bytes);
    }

    return null;
  } catch (error) {
    console.error("Erro ao decodificar DOCXML:", error);
    return null;
  }
}
