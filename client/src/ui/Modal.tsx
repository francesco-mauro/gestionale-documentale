import { useEffect, useRef, type ReactNode } from 'react';

// Finestra di dialogo sopra la pagina, basata sull'elemento <dialog> del browser:
// blocca il resto della pagina, si chiude con Esc o cliccando fuori, gestisce il focus da sola.
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    // showModal() mette il focus sul primo elemento cliccabile (la "×"): meglio sul primo campo.
    dialog.querySelector<HTMLElement>('input, select, textarea')?.focus();
  }, []);

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-title"
      onClose={onClose}
      onClick={(event) => {
        // Un clic sul fondo scuro (cioè sul dialog stesso, non sul suo contenuto) chiude la finestra.
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="modal-header">
        <h2 id="modal-title">{title}</h2>
        <button type="button" className="modal-close" aria-label="Chiudi" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
