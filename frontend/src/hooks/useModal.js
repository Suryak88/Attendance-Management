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

  const openWithMode = useCallback(
    (mode, data = null) => {
      clearTimer();
      setMode(mode);
      setOpen(true);
      if (onResetForm && data) {
        onResetForm(data);
      }
    },
    [onResetForm],
  );

  const close = useCallback(() => {
    setOpen(false);

    clearTimer();

    setTimeout(() => {
      setMode("form");
      if (onResetForm) onResetForm();
    }, 300);
  }, [onResetForm]);

  const openModal = useCallback(() => {
    // clearTimer();
    // setMode("form");
    // if (onResetForm) onResetForm();
    // setOpen(true);
    openWithMode("form");
  }, [openWithMode]);

  const editModal = useCallback(
    (data) => {
      //   clearTimer();
      //   setMode("edit");
      //   setOpen(true);
      //   if (onResetForm && data) {
      //     onResetForm(data);
      //   }
      openWithMode("edit", data);
    },
    [openWithMode],
  );

  const deleteModal = useCallback(
    (data) => {
      // setMode("confirm");
      // setOpen(true);

      // if (onResetForm && data) {
      //   onResetForm(data);
      // }
      openWithMode("confirm", data);
    },
    [openWithMode],
  );

  const showSuccess = useCallback(
    (duration = 3000) => {
      clearTimer();
      setOpen(true);
      setMode("success");

      timerRef.current = setTimeout(() => {
        close();
      }, duration);
    },
    [close],
  );

  return useMemo(
    () => ({
      openWithMode,
      open,
      mode,
      openModal,
      editModal,
      deleteModal,
      close,
      showSuccess,
    }),
    [
      openWithMode,
      open,
      mode,
      openModal,
      editModal,
      deleteModal,
      close,
      showSuccess,
    ],
  );
}
