import { useState } from "react";
import Header from "../../organisms/Header";
import Sidebar from "../../organisms/Sidebar";
import { Outlet } from "react-router-dom";
import { ChevronsLeft } from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useNotificationStore } from "../../../store/useNotificationStore";
import { useEffect } from "react";

export default function MainLayout() {
  const [isExpand, setIsExpand] = useState(false);
  const { user } = useContext(AuthContext);
  const getNotif = useNotificationStore((state) => state.getNotif);

  useEffect(() => {
    if (!user.regnum) return;

    async function refreshNotif() {
      try {
        await getNotif();
      } catch (error) {
        console.error("Failed to fetch notif: ", error);
      }
    }

    refreshNotif();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        refreshNotif();
      }
    }, 60_000);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshNotif();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user?.regnum, getNotif]);

  function handleExpand() {
    setIsExpand(!isExpand);
  }

  return (
    <>
      <div className="flex bg-red-400 py-4 h-screen overflow-hidden relative">
        {/* <div className="flex bg-linear-to-tr from-red-500 via-red-200 via-40% to-red-600 py-4 h-screen "> */}
        <Sidebar isExpand={isExpand} handleExpand={handleExpand} />

        {isExpand && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-30 lg:hidden flex"
              onClick={() => setIsExpand(false)}
            >
              <div className="ml-55 md:ml-56 my-auto">
                {/* <span
                  className={`material-symbols-outlined relative rounded-full cursor-pointer p-2 animate-bounce-Left text-white ${
                    isExpand ? "md:visible" : "md:invisible"
                  }`}
                  onClick={handleExpand}
                >
                  keyboard_double_arrow_left
                </span> */}
                <span
                  className={`relative p-2 ${isExpand ? "md:visible" : "md:invisible"}`}
                  onClick={handleExpand}
                >
                  <ChevronsLeft className="animate-bounce-Left cursor-pointer text-white " />
                </span>
              </div>
            </div>
          </>
        )}

        <div className="flex flex-col flex-1 min-h-0 xl:pl-2 pr-2 md:pr-2 lg:pr-4 xl:pr-6 overflow-hidden">
          <Header isExpand={isExpand} handleExpand={handleExpand} />
          {/* <Dashboard /> */}
          {/* <div className="flex flex-1 justify-between h-screen mt-5 ml-2 lg:ml-0 rounded-xl shadow-md overflow-hidden"> */}
          <div className="flex flex-col flex-1 min-h-0 justify-between mt-5 ml-2 lg:ml-0 rounded-xl shadow-md overflow-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
}
