import { useContext } from "react";
import { useEffect } from "react";
import { useRef, useState } from "react";
import { AuthContext } from "../../../context/AuthContext";
import {
  Bell,
  CheckCheck,
  CircleUserRound,
  Menu,
  RefreshCw,
  Search,
} from "lucide-react";
import logo from "../../../assets/logo.png";
import PopUpMenu from "../PopUpMenu";
import Button from "../../atoms/Button";
import { LogOut } from "lucide-react";
import api from "../../../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../../hooks/useModal";
import Modal from "../Modal";
import ModalPanel from "../Modal/modalPanel";
import FloatingInput from "../../atoms/FloatingInput";
import { toast } from "sonner";
import FormSuccess from "../Modal/contents/FormSuccess";
import { formatNotif } from "../../../utils/notificationConfig";
import { formatTimeAgo } from "../../../utils/Date";
import { useNotificationStore } from "../../../store/useNotificationStore";
import { useNotificationClick } from "../../../hooks/useNotificationClick";
import { useDelayedLoading } from "../../../hooks/useDelayedLoading";

export default function Header({ isExpand, handleExpand }) {
  const { user, logout } = useContext(AuthContext);
  const [search, setSearch] = useState("");
  // const [greeting, setGreeting] = useState("");
  const inputRef = useRef(null);
  const [popup, setPopup] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [notifPopup, setNotifPopup] = useState(null);
  const [notifPopupOpen, setNotifPopupOpen] = useState(false);
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { open, openWithMode, close, openModal, showSuccess, mode } =
    useModal(resetModal);
  const isDifferentPassword =
    confirmPassword !== "" && newPassword !== confirmPassword;
  const notifications = useNotificationStore((state) => state.notifications);
  const formattedNotifications = formatNotif(notifications.data);
  const getNotification = useNotificationStore((state) => state.getNotif);
  const markAllAsReadNotif = useNotificationStore(
    (state) => state.markAllAsRead,
  );
  const [activeTab, setActiveTab] = useState("all");
  const displayedNotifications =
    activeTab === "unread"
      ? formattedNotifications.filter((data) => data.is_read === 0).slice(0, 10)
      : formattedNotifications.slice(0, 10);
  const notifListRef = useRef(null);
  const { handleClickNotif } = useNotificationClick();
  const getNotifLoader = useDelayedLoading();
  const markAllAsReadLoader = useDelayedLoading();

  function handleClear() {
    setSearch("");
  }

  useEffect(() => {
    getNotif();
  }, [user]);

  // useEffect(() => {
  //   setGreeting(getGreeting());
  //   console.log(user?.username);
  // }, []);

  function getGreeting() {
    const hour = new Date().getHours();

    if (hour >= 0 && hour < 11) return "Good Morning";
    if (hour >= 11 && hour < 15) return "Good Afternoon";
    if (hour >= 15 && hour < 19) return "Good Evening";
    return "Good Night";
  }

  async function getNotif() {
    try {
      getNotifLoader.startLoading();
      await getNotification();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch notification",
      );
    } finally {
      getNotifLoader.stopLoading();
    }
  }

  function resetModal() {
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  function handleDetailPopup(e, index, item) {
    e.stopPropagation();

    if (popup && popup.index === index) {
      handleClosePopup();

      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();

    setPopup({
      index,
      item,
      rect,
    });
    setPopupOpen(false);

    requestAnimationFrame(() => {
      setPopupOpen(true);
    });
  }

  function handleClosePopup() {
    setPopupOpen(false);
    setTimeout(() => {
      setPopup(null);
    }, 200);
  }

  async function handleNotifPopup(e) {
    e.stopPropagation();

    if (notifPopup) {
      handleCloseNotifPopup();
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    await getNotif();
    setNotifPopup({
      rect,
    });

    setNotifPopupOpen(false);

    requestAnimationFrame(() => {
      setNotifPopupOpen(true);
    });
  }

  function handleCloseNotifPopup() {
    setNotifPopupOpen(false);
    setTimeout(() => {
      setNotifPopup(null);
    }, 200);
  }

  async function handleLogout() {
    try {
      await api.post("/users/logout", {}, { withCredentials: true });

      logout();
      sessionStorage.clear();
      navigate("/");
    } catch (error) {
      console.error(`Gagal Logout: ${error}`);
    }
  }

  async function submitChangePw() {
    if (!password || password.trim() === "") {
      toast.error("Please enter your password");
      return;
    }
    if (!newPassword || newPassword.trim() === "") {
      toast.error("Please enter your new password");
      return;
    }
    if (!confirmPassword || confirmPassword.trim() === "") {
      toast.error("Please confirm your new password");
      return;
    }
    if (isDifferentPassword) {
      toast.error("Password baru dan konfirmasi password baru harus sama!");
      return;
    }

    try {
      await api.post("/users/updatePW", {
        curPassword: password,
        newPassword,
      });

      showSuccess();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to change password",
      );
    }
  }

  function handleChangeTab(tab) {
    setActiveTab(tab);

    notifListRef.current?.scrollTo({
      top: 0,
      behavior: "instant",
    });
  }

  async function markAllAsRead() {
    try {
      markAllAsReadLoader.startLoading();
      await markAllAsReadNotif();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to mark as read");
    } finally {
      markAllAsReadLoader.stopLoading();
    }
  }

  return (
    <>
      <div className="flex flex-row">
        <div
          className={`lg:hidden flex w-13 h-13 md:w-16 md:h-16 rounded-xl mx-2 bg-slate-100 shadow-md`}
        >
          {/* <span
            className="material-symbols-outlined m-auto text-xl! md:text-[27px]! select-none cursor-pointer"
            onClick={handleExpand}
          >
            menu
          </span> */}
          <span
            className={`m-auto select-none cursor-pointer`}
            onClick={handleExpand}
          >
            <Menu className="size-5 md:size-6" />
          </span>
        </div>

        <div className="w-full h-13 md:h-16 rounded-xl flex justify-between bg-slate-100 shadow-md">
          <div className="flex w-1/2 md:px-2">
            <div className="flex w-full mx-2 my-auto rounded-lg md:rounded-xl bg-slate-200">
              {/* <span
                className="material-symbols-outlined py-1 pl-2 pr-1 text-[20px]! md:text-[24px]! my-auto"
                onClick={() => inputRef.current?.focus()}
              >
                search
              </span> */}
              <span className="flex items-center pl-2 pr-1">
                <Search
                  size={"18px"}
                  onClick={() => inputRef.current?.focus()}
                />
              </span>
              <input
                ref={inputRef}
                type="text"
                name="search"
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search here .."
                className="w-full md:px-1 peer focus:outline-none text-sm lg:text-base"
              />

              <span
                className={`material-symbols-outlined p-1 hover:bg-slate-300 cursor-pointer rounded-xl
            ${search ? "visible" : "invisible"}`}
                onClick={handleClear}
              >
                close
              </span>
            </div>
          </div>

          <div className="flex w-1/2 items-center justify-end px-2 md:px-4">
            {/* <div className="flex text-right md:text-center text-xs md:text-sm lg:text-base bg-indigo-200">
              {getGreeting()}, {user?.username}!
            </div> */}
            <div className="flex gap-2 md:gap-3 cursor-pointer items-center">
              <div
                className={`flex items-center p-1 group hover:bg-slate-200 rounded-full transition-all ${notifPopupOpen ? "bg-slate-200" : ""} relative`}
                onClick={handleNotifPopup}
              >
                <Bell className="size-4 lg:size-5 text-slate-500 group-hover:text-slate-700 transition-all" />
                <span
                  className={`flex items-center justify-center rounded-full transition-all bg-red-400 group-hover:bg-red-500 w-[13px] h-[13px] lg:w-[15px] lg:h-[15px] lg:text-[10px] absolute top-0 right-0 text-[8px] text-white select-none
                  ${notifications.unread > 0 ? "opacity-100" : "opacity-0"}`}
                >
                  {notifications.unread > 9 ? "9+" : notifications.unread}
                </span>
              </div>
              {/* <div className="flex items-center text-right md:text-center text-xs md:text-sm lg:text-base">
                {user?.username}
              </div> */}
              <div
                className="flex justify-center items-center"
                onClick={handleDetailPopup}
              >
                {user?.photo ? (
                  <img
                    src={logo}
                    alt="Profile"
                    className="w-7 h-7 lg:w-8 lg:h-8 object-cover rounded-full outline-1 outline-slate-400 select-none"
                  />
                ) : user?.fullname ? (
                  <span className="flex items-center justify-center rounded-full outline-1 outline-slate-400 text-slate-500 font-normal text-lg shadow-sm bg-slate-200 w-7 h-7 lg:w-8 lg:h-8 hover:outline-slate-600 hover:text-slate-600 transition-all select-none">
                    {user?.fullname.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <CircleUserRound
                    strokeWidth={"1.25px"}
                    size={"32px"}
                    color={"#94a3b8"}
                  />
                )}
              </div>
            </div>

            {/* <div className="mx-2 md:mx-5 w-10 md:w-24 max-h-full my-auto flex bg-amber-200">
              <label
                htmlFor=""
                className="max-w-full -translate-y-1 md:-translate-y-1/4 text-xs text-center md:text-sm lg:text-base"
              >
                <span className="material-symbols-outlined py-1 px-2 translate-y-1/7 md:translate-y-1/4 text-[20px]! md:text-[24px]! select-none">
                  light_mode
                </span>
                Light
              </label>
            </div> */}
          </div>
        </div>

        {popup && (
          <PopUpMenu
            position={popup.rect}
            open={popupOpen}
            onClose={handleClosePopup}
            popupWidth="w-50 md:w-60"
          >
            <div className="flex flex-1 flex-col gap-2 p-1 m-1 text-xs">
              <div className="flex shrink-0 w-full justify-start items-center gap-3">
                {user?.photo ? (
                  <img
                    src={logo}
                    alt="Profile"
                    className="w-10 h-10 object-cover rounded-full outline-1 outline-slate-400 select-none"
                  />
                ) : user?.fullname ? (
                  <span className="flex shrink-0 items-center justify-center rounded-full outline-1 outline-slate-400 text-slate-500 font-normal text-lg shadow-sm bg-slate-200 w-10 h-10">
                    {user?.fullname.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <CircleUserRound
                    strokeWidth={"1.25px"}
                    size={"40px"}
                    color={"#94a3b8"}
                  />
                )}
                <p className="font-medium text-sm min-w-0">{user?.fullname}</p>
              </div>
              <hr className="text-slate-400 shadow-sm mt-1" />
              <div className="flex flex-col gap-1">
                <Button
                  btnTitle="Change Password"
                  btnWidth="w-full"
                  btnLabel={"Change Password"}
                  btnColor="outline-1 outline-slate-100 rounded-lg hover:outline-slate-500 hover:text-black/60!"
                  textSize="text-sm font-normal! shadow-none! hover:shadow-sm!"
                  handleClick={() => openWithMode("ChangePw")}
                />
                <hr className="text-slate-200 shadow-xs" />
                <Button
                  btnTitle="Log Out"
                  btnWidth="w-full"
                  btnLabel={
                    <div className="flex items-center justify-center gap-2">
                      <LogOut size={16} />
                      <span>Log Out</span>
                    </div>
                  }
                  btnColor="outline-1 outline-slate-100 rounded-lg hover:outline-slate-500 hover:text-black/60!"
                  textSize="text-sm font-normal! shadow-none! hover:shadow-sm!"
                  handleClick={handleLogout}
                />
              </div>
            </div>
          </PopUpMenu>
        )}

        {notifPopup && (
          <PopUpMenu
            position={notifPopup.rect}
            open={notifPopupOpen}
            onClose={handleCloseNotifPopup}
            popupWidth="w-2xs md:w-xs max-h-[70dvh]"
          >
            <div className="flex flex-1 flex-col p-1 m-1 gap-2 min-h-0">
              <div className="flex justify-between items-center shrink-0">
                <h3 className="text-slate-600 font-medium">Notifikasi</h3>
                <span title="Refresh Notification" onClick={getNotif}>
                  <RefreshCw
                    className={`size-4 text-slate-500 cursor-pointer hover:rotate-180 transition-all duration-400 ${getNotifLoader.loading ? "animate-spin" : ""}`}
                  />
                </span>
              </div>
              <div className="flex rounded-xl bg-slate-200 p-1 gap-1 shrink-0 relative">
                <div
                  className={`absolute top-1 bottom-1 left-1 rounded-lg bg-slate-100 w-[calc((100%-0.5rem)/2)] shadow-md transition-transform duration-300 ease-in-out ${activeTab === "unread" ? "translate-x-full" : "translate-0"}`}
                />
                <button
                  className={`z-10 flex-1 cursor-pointer rounded-lg p-1 text-sm  hover:text-black transition-all ${activeTab === "all" ? "text-black" : "text-slate-700"}`}
                  onClick={() => handleChangeTab("all")}
                >
                  Semua
                </button>
                <button
                  className={`z-10 flex flex-1 items-center justify-center gap-1 cursor-pointer rounded-lg p-1 text-sm hover:text-black transition-all ${activeTab === "unread" ? "text-black" : "text-slate-700"}`}
                  onClick={() => handleChangeTab("unread")}
                >
                  Belum Dibaca
                  <span
                    className={`bg-slate-300 rounded-lg px-1.5 text-xs transition-all ${notifications.unread > 0 ? "opacity-100" : "opacity-0 hidden"}`}
                  >
                    {notifications.unread}
                  </span>
                </button>
              </div>

              <div
                ref={notifListRef}
                className="flex flex-col flex-1 gap-1 min-h-0 overflow-y-auto"
              >
                {displayedNotifications.length === 0 &&
                  !getNotifLoader.loading && (
                    <div className="flex min-h-15 justify-center items-center">
                      <h3 className="text-slate-700 font-medium text-sm">
                        Tidak ada notifikasi
                      </h3>
                    </div>
                  )}
                {getNotifLoader.loading ? (
                  <div
                    className={`flex rounded-xl transition-all text-transparent`}
                  >
                    <div className="flex justify-center p-1 shrink-0">
                      <div
                        className={`skeleton size-7 shrink-0 mt-1 rounded-full bg-slate-200 select-none`}
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5 p-1">
                      <div className="flex items-start gap-0.5 justify-between">
                        <div className="skeleton flex items-center gap-1 rounded-lg bg-slate-200">
                          <h3 className="text-sm font-medium">Loading...</h3>
                        </div>
                        <div className="skeleton pt-0.5 rounded-lg bg-slate-200">
                          <p className="text-[10px] text-right text-nowrap">
                            loading
                          </p>
                        </div>
                      </div>
                      <p className="skeleton bg-slate-200 rounded-lg text-xs ">
                        Loading
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {displayedNotifications.map((notif) => {
                      const Icon = notif?.icon;
                      return (
                        <div
                          key={`notif-${notif?.id}`}
                          className={`flex rounded-xl cursor-pointer ${notif?.is_read ? "" : "bg-sky-100"} hover:bg-blue-100 transition-all`}
                          onClick={() =>
                            handleClickNotif(notif, handleCloseNotifPopup)
                          }
                        >
                          <div className="flex justify-center p-1 shrink-0">
                            <Icon
                              className={`size-6 shrink-0 mt-1 ${notif?.styling} `}
                              strokeWidth={"1.5px"}
                            />
                          </div>
                          <div className="flex flex-col p-1">
                            <div className="flex items-start gap-0.5 justify-between">
                              <div className="flex items-center gap-1">
                                {notif?.is_read === 0 && (
                                  <span className="size-1.5 shrink-0 rounded-full bg-sky-300 select-none" />
                                )}
                                <h3 className="text-sm font-medium text-slate-700">
                                  {notif?.title}
                                </h3>
                              </div>
                              <div className="pt-0.5">
                                <p className="text-[10px] text-right text-nowrap text-slate-500">
                                  {formatTimeAgo(notif?.created_at)}
                                </p>
                              </div>
                            </div>
                            <p className="text-xs text-slate-600">
                              {notif?.message}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              <div className="flex justify-between text-xs shrink-0 px-2">
                <button
                  className="flex justify-center items-center gap-0.5 text-slate-700  hover:text-black hover:underline cursor-pointer transition-all disabled:text-slate-500 disabled:hover:no-underline"
                  onClick={markAllAsRead}
                  disabled={
                    notifications.unread === 0 || markAllAsReadLoader.loading
                  }
                >
                  <span>
                    <CheckCheck className="size-3.5" />
                  </span>
                  Tandai semua dibaca
                </button>
                <button
                  className="p-2 bg-slate-200 outline-1 outline-slate-300 text-slate-700  hover:text-black rounded-lg shadow-sm cursor-pointer hover:outline-slate-500 transition-all"
                  onClick={() => {
                    handleCloseNotifPopup();
                    navigate("notification");
                  }}
                >
                  Lihat semua
                </button>
              </div>
            </div>
          </PopUpMenu>
        )}

        <Modal openModal={open} onClose={close}>
          {mode === "ChangePw" && (
            <ModalPanel title={"Change Password"} handleClose={close}>
              <div className="flex flex-col lg:w-80">
                <div className="flex flex-col px-2 pb-2">
                  <FloatingInput
                    id="Current Password"
                    type="password"
                    value={password}
                    onValueChange={setPassword}
                    message={"Please enter your password"}
                    autoComplete="current-password"
                  />
                </div>
                <hr className="text-slate-400! shadow-sm" />

                <div className="flex flex-col p-2 mt-2">
                  <FloatingInput
                    id="New Password"
                    type="password"
                    value={newPassword}
                    onValueChange={setNewPassword}
                    message={"Please enter your new password"}
                    autoComplete="current-password"
                  />
                  <FloatingInput
                    id="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onValueChange={setConfirmPassword}
                    message={
                      isDifferentPassword
                        ? "Passwords don't match"
                        : "Please confirm your password"
                    }
                    autoComplete="current-password"
                    isExternalError={isDifferentPassword}
                  />
                </div>

                <div className="flex mt-4 mb-2">
                  <Button
                    btnLabel={"Cancel"}
                    btnColor="bg-slate-300 hover:bg-slate-400 outline-1 outline-slate-600 disabled:bg-slate-300 disabled:outline-slate-400 disabled:text-black/40 disabled:hover:shadow-md transition-all"
                    btnWidth=""
                    textSize="text-base font-normal!"
                    // btndisable={true}
                    handleClick={close}
                  />
                  <Button
                    btnLabel={"Change"}
                    btnColor="bg-blue-200 hover:bg-blue-300 outline-1 outline-blue-600 disabled:bg-slate-300 disabled:outline-slate-400 disabled:text-black/40 disabled:hover:shadow-md transition-all "
                    btnWidth=""
                    textSize="text-base font-normal!"
                    handleClick={submitChangePw}
                  />
                </div>
              </div>
            </ModalPanel>
          )}
          {mode === "success" && (
            <ModalPanel title={`Password Changed!`} handleClose={close}>
              <FormSuccess />
              <Button handleClick={close} btnLabel={"OK"} />
            </ModalPanel>
          )}
        </Modal>
      </div>
    </>
  );
}
