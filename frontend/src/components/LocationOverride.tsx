import { useState, type FormEvent } from "react";
import { MapPinIcon, ChevronDownIcon } from "./icons";

interface Props {
  isManual: boolean;
  currentCoords: { lat: number; long: number } | null;
  onSave: (lat: number, long: number) => void;
  onClear: () => void;
}

export function LocationOverride({ isManual, currentCoords, onSave, onClear }: Props) {
  const [open, setOpen] = useState(false);
  const [lat, setLat] = useState(currentCoords ? String(currentCoords.lat) : "");
  const [long, setLong] = useState(currentCoords ? String(currentCoords.long) : "");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsedLat = Number(lat);
    const parsedLong = Number(long);
    if (Number.isNaN(parsedLat) || Number.isNaN(parsedLong)) return;
    onSave(parsedLat, parsedLong);
    setOpen(false);
  }

  return (
    <div className="relative sm:inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="chip w-full justify-between border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink-soft)] sm:w-auto"
      >
        <span className="flex items-center gap-2">
          <MapPinIcon width={15} height={15} className="text-[var(--color-brand)]" />
          {isManual ? "Ubicación fijada manualmente" : "Usando GPS del dispositivo"}
        </span>
        <ChevronDownIcon
          width={14}
          height={14}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="card absolute left-0 z-20 mt-2 flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-3 p-4"
        >
          <p className="text-xs leading-relaxed text-[var(--color-muted)]">
            Útil para kioskos fijos o pruebas: fija lat/long en vez de usar el GPS del navegador.
          </p>
          <div className="flex gap-2">
            <label className="field min-w-0 flex-1">
              <input
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="Latitud"
                inputMode="decimal"
                className="min-w-0"
              />
            </label>
            <label className="field min-w-0 flex-1">
              <input
                value={long}
                onChange={(e) => setLong(e.target.value)}
                placeholder="Longitud"
                inputMode="decimal"
                className="min-w-0"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary flex-1 !py-2 text-sm">
              Guardar
            </button>
            {isManual && (
              <button
                type="button"
                onClick={onClear}
                className="btn btn-ghost flex-1 !py-2 text-sm"
              >
                Usar GPS
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
