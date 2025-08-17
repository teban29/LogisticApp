import Modal from "./Modal";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "confirmar",
  message = "Seguro?",
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-gray-700">{message}</p>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onClose} className="px-3 py-2 border rounded-xl">
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 rounded-xl bg-red-600 text-white">
          Confirmar
        </button>
      </div>
    </Modal>
  );
}
