import { useEffect, useRef, useState } from "react";
import { Check, Copy, ExternalLink, MessageCircle, Share2, X } from "lucide-react";
import { copyText, qrDataUrl } from "../share.js";

/** Modal with a QR code and a link, plus copy / WhatsApp / native share. */
export default function ShareDialog({ open, onClose, title, description, url, message }) {
  const ref = useRef(null);
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    if (open && url) qrDataUrl(url).then(setQr);
    setCopied(false);
  }, [open, url]);

  const text = `${message} ${url}`;

  return (
    <dialog ref={ref} className="dialog" onClose={onClose} aria-labelledby="share-title">
      <div className="card-head">
        <h2 id="share-title" className="card-title">{title}</h2>
        <button className="icon-btn ghost" onClick={onClose} aria-label="Close"><X size={18} /></button>
      </div>
      <p className="muted">{description}</p>
      {qr && <img className="qr" src={qr} alt={`QR code linking to ${title}`} />}
      <div className="link-box">
        <input readOnly value={url} aria-label="Link" onFocus={(e) => e.target.select()} />
        <button className="btn btn-soft" onClick={async () => setCopied(await copyText(url))}>
          {copied ? <><Check size={16} aria-hidden="true" /> Copied</> : <><Copy size={16} aria-hidden="true" /> Copy</>}
        </button>
      </div>
      <div className="row">
        <a className="btn btn-whatsapp" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">
          <MessageCircle size={18} aria-hidden="true" /> Share on WhatsApp
        </a>
        {navigator.share && (
          <button className="btn btn-soft" onClick={() => navigator.share({ title, text: message, url }).catch(() => {})}>
            <Share2 size={18} aria-hidden="true" /> More options
          </button>
        )}
        <a className="btn btn-soft" href={url} target="_blank" rel="noreferrer"><ExternalLink size={18} aria-hidden="true" /> Preview</a>
      </div>
    </dialog>
  );
}
