import { useContext } from "react";
import { useEffect } from "react";
import { useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { formatNotif } from "../../utils/notificationConfig";
import { toast } from "sonner";
import { formatLocalDate, formatTimeAgo } from "../../utils/Date";
import { BellOff } from "lucide-react";
import { useNotificationStore } from "../../store/useNotificationStore";
import { useNotificationClick } from "../../hooks/useNotificationClick";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";
import BtnLoading from "../../components/atoms/BtnLoading";

export default function Notification() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("all");
  const notifications = useNotificationStore((state) => state.notifications);
  const getNotifications = useNotificationStore((state) => state.getNotif);
  const markAllAsReadNotif = useNotificationStore(
    (state) => state.markAllAsRead,
  );
  const formattedNotifications = formatNotif(notifications.data);
  const today = formatLocalDate(new Date());
  const displayedNotifications =
    activeTab === "unread"
      ? formattedNotifications.filter((n) => n.is_read === 0)
      : formattedNotifications;
  const notifToday = displayedNotifications.filter(
    (n) => n.created_at.slice(0, 10) === today,
  );
  const notifEarlier = displayedNotifications.filter(
    (n) => n.created_at.slice(0, 10) !== today,
  );
  const { handleClickNotif } = useNotificationClick();
  const markAllAsReadLoader = useDelayedLoading();

  useEffect(() => {
    getNotif();
  }, [user]);

  async function getNotif() {
    try {
      await getNotifications();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch notification",
      );
    }
  }

  async function markAllAsRead() {
    try {
      markAllAsReadLoader.startLoading();
      await markAllAsReadNotif();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to mark all as read",
      );
    } finally {
      markAllAsReadLoader.stopLoading();
    }
  }

  return (
    <div className="bg-slate-100 flex flex-col flex-1 p-0.5">
      <div className="flex justify-between">
        <div className="flex flex-col gap-1 p-3">
          <h3 className="text-xl md:text-2xl font-medium">Notifikasi</h3>
          <p
            className={`text-slate-600 text-xs lg:text-sm transition-all ${notifications.unread > 0 ? "opacity-100" : "opacity-0 -translate-y-5"}`}
          >
            Anda memiliki {notifications.unread} Notifikasi belum dibaca
          </p>
        </div>
        <div className="flex items-center p-3" onClick={markAllAsRead}>
          <button
            className="text-xs w-24 md:w-36 font-medium cursor-pointer outline-1 text-slate-600 rounded-lg p-2 outline-slate-400 hover:text-black hover:outline-slate-600 transition-all"
            disabled={markAllAsReadLoader.loading}
          >
            {markAllAsReadLoader.loading ? (
              <BtnLoading />
            ) : (
              "Tandai semua dibaca"
            )}
          </button>
        </div>
      </div>

      <div className="relative flex items-center mx-3 text-sm transition-all w-3xs shrink-0">
        <div
          className={`absolute bottom-0 w-1/2 h-0.5 bg-slate-700 transition-transform duration-300 ${activeTab === "unread" ? "translate-x-full" : "translate-0"}`}
        />
        <button
          className={`p-1 flex-1 font-medium text-nowrap outline-0 cursor-pointer transition-all
             ${activeTab === "all" ? "text-slate-800" : "text-slate-500 hover:text-slate-700 "}`}
          onClick={() => setActiveTab("all")}
        >
          Semua
        </button>
        <button
          className={`p-1 flex-1 font-medium text-nowrap outline-0 cursor-pointer transition-all ${activeTab === "unread" ? "text-slate-800" : "text-slate-500 hover:text-slate-700 "}`}
          onClick={() => setActiveTab("unread")}
        >
          Belum Dibaca
        </button>
      </div>

      <div className="flex flex-col flex-1 p-2 my-2 ">
        {displayedNotifications.length === 0 ? (
          <div className="flex flex-col justify-center items-center bg-slate-100 h-25">
            <span className="text-slate-500">
              <BellOff />
            </span>
            <h3 className="text-slate-500 font-medium text-sm">
              Tidak ada notifikasi
            </h3>
          </div>
        ) : (
          <>
            {notifToday.length > 0 && (
              <NotificationSection
                title={"Hari ini"}
                notifications={notifToday}
                handleClick={handleClickNotif}
              />
            )}
            {notifEarlier.length > 0 && (
              <NotificationSection
                title={"Terdahulu"}
                notifications={notifEarlier}
                handleClick={handleClickNotif}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function NotificationSection({ title, notifications, handleClick }) {
  return (
    <div className="flex flex-col w-full px-1">
      <h3 className="text-sm font-medium text-slate-600">{title}</h3>
      <div className="flex flex-col rounded-xl m-2 max-w-3xl bg-slate-50 outline-1 outline-slate-300 divide-y divide-slate-300 overflow-hidden">
        {notifications.map((notif) => {
          const Icon = notif.icon;

          return (
            <button
              key={`notification-${notif?.id}`}
              type="button"
              className="flex text-left p-1 cursor-pointer hover:bg-slate-200 transition-all outline-none"
              onClick={() => handleClick(notif)}
            >
              <div className="flex justify-center shrink-0 py-0.5">
                <Icon
                  className={`size-8 shrink-0 m-1 ${notif?.styling}`}
                  strokeWidth={"1.5px"}
                />
              </div>
              <div className="flex flex-col p-1 w-full justify-center min-w-0">
                <div className="flex items-start gap-0.5 justify-between w-full">
                  <div className="flex items-center gap-1">
                    <h3 className="text-sm font-medium text-slate-700">
                      {notif?.title}
                    </h3>
                    {notif.is_read === 0 && (
                      <span className="size-1.5 shrink-0 rounded-full bg-sky-400 select-none" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-left text-slate-600">
                  {notif?.message}
                </p>
              </div>
              <div className="flex flex-col justify-center p-1">
                <p className="text-[10px] lg:text-xs text-right text-nowrap text-slate-500">
                  {formatTimeAgo(notif?.created_at)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
