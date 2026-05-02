/**
 * Helper functions to handle PCM16 <-> Base64 conversion for the OpenAI Realtime API.
 * The API requires 24kHz, 1 channel, 16-bit PCM audio.
 */

export function float32ToPcm16Base64(float32Array: Float32Array): string {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  
  for (let i = 0; i < float32Array.length; i++) {
    // Clamp to -1.0 .. 1.0
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    // Convert to 16-bit signed integer
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true); // true = little-endian
  }

  // Convert ArrayBuffer to Base64
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64Pcm16ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  
  const view = new DataView(buffer);
  const float32Array = new Float32Array(buffer.byteLength / 2);
  
  for (let i = 0; i < float32Array.length; i++) {
    const int16 = view.getInt16(i * 2, true); // true = little-endian
    // Convert back to -1.0 .. 1.0 float
    float32Array[i] = int16 < 0 ? int16 / 0x8000 : int16 / 0x7FFF;
  }
  
  return float32Array;
}
