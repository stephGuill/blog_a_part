import "./Modal.css";

function Modal({ children, isOpen, onClose, title }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <section className="modal">
        <div className="modal__header">
          <h2>{title}</h2>
          <button aria-label="Fermer" onClick={onClose} type="button">
            x
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export default Modal;
