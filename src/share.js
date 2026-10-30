import QRCode from "qrcode";

export function encodePayload(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = "";
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodePayload(str) {
  try {
    const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
  } catch {
    return null;
  }
}

export const appUrl = (route) => `${location.origin}${location.pathname}#${route}`;

export const qrDataUrl = (text) =>
  QRCode.toDataURL(text, { margin: 1, width: 360, color: { dark: "#2b2340", light: "#ffffff" } });

export function passportPayload(data) {
  return encodePayload({
    n: data.profile.name,
    b: data.profile.business,
    l: data.profile.location,
    a: data.profile.about,
    s: data.profile.skills,
    j: data.jobs.map((j) => ({
      t: j.title,
      d: j.date,
      a: j.amount,
      s: j.skills,
      v: j.verifications.map((v) => ({ n: v.name, r: v.rating, c: v.comment.slice(0, 140) })),
    })),
  });
}

export const verifyPayload = (job, workerName) => encodePayload({ id: job.id, t: job.title, d: job.date, w: workerName });

/** Shrink a photo to keep localStorage small. */
export function resizeImage(file, max = 640) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
