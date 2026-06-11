import { useRef, useState } from "react";

export function useFilter(initialValue) {
  const initialRef = useRef(initialValue);
  const [draftFilter, setDraftFilter] = useState(initialValue);
  const [activeFilter, setActiveFilter] = useState(initialValue);

  function setField(field, value) {
    setDraftFilter((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function applyFilter() {
    setActiveFilter(draftFilter);
  }

  function syncDraftWithActive() {
    setDraftFilter(activeFilter);
  }

  function resetFilter() {
    setDraftFilter(initialRef.current);
  }

  return {
    draftFilter,
    activeFilter,
    setField,
    applyFilter,
    resetFilter,
    syncDraftWithActive,
    setActiveFilter,
    setDraftFilter,
  };
}
