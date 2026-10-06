import { useNavigate } from "react-router-dom";
import { useNotificationStore } from "../store/useNotificationStore";
import { toast } from "sonner";

export function useNotificationClick() {
  const navigate = useNavigate();

  const markAsRead = useNotificationStore((state) => state.markAsRead);

  async function handleClickNotif(notif, onClose) {
    if (notif.is_read === 0) {
      try {
        await markAsRead(notif);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to mark as read");
      }
    }

    onClose?.();

    if (!notif.path) return;

    const navigateAdrress = notif.reference_id
      ? `${notif.path}?id=${encodeURIComponent(notif.reference_id)}`
      : `${notif.path}`;

    navigate(navigateAdrress);
  }
  return { handleClickNotif };
}
