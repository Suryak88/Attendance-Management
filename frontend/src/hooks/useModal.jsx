import { useState, useCallback, useRef, useMemo } from "react";

export function useModal(onResetForm) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("form");
  const timerRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  const close = useCallback(() => {
    setOpen(false);

    clearTimer();
    if (onResetForm) onResetForm();

    setTimeout(() => {
      setMode("form");
    }, 300);
  }, [onResetForm]);

  const openModal = useCallback(() => {
    clearTimer();
    setMode("form");
    if (onResetForm) onResetForm();
    setOpen(true);
  }, [onResetForm]);

  const editModal = useCallback(
    (data) => {
      clearTimer();
      setMode("edit");
      setOpen(true);

      if (onResetForm && data) {
        onResetForm(data);
      }
    },
    [onResetForm]
  );

  const deleteModal = useCallback(
    (data) => {
      setMode("confirm");
      setOpen(true);

      if (onResetForm && data) {
        onResetForm(data);
      }
    },
    [onResetForm]
  );

  const showSuccess = useCallback(
    (duration = 7000) => {
      clearTimer();
      setMode("success");

      timerRef.current = setTimeout(() => {
        close();
      }, duration);
    },
    [close]
  );

  return useMemo(
    () => ({
      open,
      mode,
      openModal,
      editModal,
      deleteModal,
      close,
      showSuccess,
    }),
    [open, mode, openModal, editModal, deleteModal, close, showSuccess]
  );
}
