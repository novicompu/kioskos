import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CloseIcon, ImageOffIcon } from "./icons";

interface Props {
  src: string;
  alt: string;
  onClose: () => void;
}

/**
 * Visor de imagen a pantalla completa (foto original, sin recorte
 * automatico). Se monta via portal directo a document.body (libera al
 * lightbox de cualquier overflow/stacking de sus ancestros). React
 * burbujea los eventos sinteticos por el arbol de componentes, no por el
 * DOM, asi que un portal por si solo NO evita que un click aqui llegue al
 * onClick del modal de detalle que lo contiene -- por eso se corta la
 * propagacion explicitamente, para que un click en este fondo solo cierre
 * el lightbox y no arrastre consigo al modal de detalle.
 */
export function ImageLightbox({ src, alt, onClose }: Props) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleClose(event: { stopPropagation: () => void }) {
    event.stopPropagation();
    onClose();
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--color-ink)]/80 p-4 sm:p-10"
      onClick={handleClose}
    >
      <button
        onClick={handleClose}
        aria-label="Cerrar"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:right-6 sm:top-6"
      >
        <CloseIcon width={20} height={20} />
      </button>

      {failed ? (
        <div className="flex flex-col items-center gap-2 text-white/70">
          <ImageOffIcon width={40} height={40} />
          <p className="text-sm">No pudimos cargar la imagen.</p>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          onClick={(e) => e.stopPropagation()}
          onError={() => setFailed(true)}
          className="max-h-full max-w-full rounded-[var(--radius-lg)] object-contain shadow-[var(--shadow-pop)]"
        />
      )}
    </div>,
    document.body,
  );
}
