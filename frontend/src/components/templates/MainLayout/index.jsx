import { useState } from "react";
import Header from "../../organisms/Header";
import Sidebar from "../../organisms/Sidebar";
import Dashboard from "../../../pages/Dashboard";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  const [isExpand, setIsExpand] = useState(false);

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
              <div className="ml-54 my-auto">
                <span
                  className={`material-symbols-outlined relative rounded-full cursor-pointer p-2 animate-bounce-Left text-white ${
                    isExpand ? "md:visible" : "md:invisible"
                  }`}
                  onClick={handleExpand}
                >
                  keyboard_double_arrow_left
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
