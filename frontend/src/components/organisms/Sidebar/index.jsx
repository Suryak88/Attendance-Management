import api from "../../../utils/axiosInstance";
import SidebarButton from "../../atoms/SidebarButton";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import { useContext, useState } from "react";
import { menu } from "../../../data/menu";
import logo from "../../../assets/logo.png";
import { filterMenuByRole } from "../../../utils/filterMenuByRole";
import { X } from "lucide-react";

export default function Sidebar({ isExpand, handleExpand }) {
  const { user } = useContext(AuthContext);
  const filteredMenu = filterMenuByRole(menu, user?.role);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useContext(AuthContext);
  const [openMenu, setOpenMenu] = useState({});
  function toggleMenu(id) {
    setOpenMenu((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
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

  async function handleClick(path) {
    if (path) navigate(path);
  }

  return (
    <>
      <div
        className={`z-40 mx-0 w-1/2 sm:w-54 flex flex-col bg-slate-100 shadow-md transform transition-transform duration-500 ease-in-out overflow-hidden
        fixed top-0 left-0 rounded-r-2xl h-full md:w-54 
        ${isExpand ? "translate-x-0" : "-translate-x-full"}
        lg:static lg:h-full lg:w-9/56 lg:mx-4 lg:rounded-2xl lg:translate-0
        xl:w-4/28`}
      >
        <div className="flex justify-between">
          <img
            src={logo}
            alt="Bagus"
            className="w-1/2 md:w-1/2 ml-4 py-5 lg:w-2/3 xl:w-1/2 xl:ml-6"
          />{" "}
          <span
            className={`mx-3 mt-5 hover:bg-slate-300 hover:text-red-600 cursor-pointer rounded-xl h-fit p-0.5
            ${isExpand ? "visible" : "invisible"}`}
            onClick={handleExpand}
          >
            <X />
          </span>
        </div>
        <div className="flex flex-col flex-1 justify-between min-h-0">
          <div className="px-2 min-h-0 overflow-y-auto">
            {filteredMenu.length > 0 &&
              filteredMenu.map((m) => {
                if (m.children) {
                  const isActiveParent = m.children?.some(
                    (c) => c.path === location.pathname,
                  );

                  const isOpen = openMenu[m.id] || isActiveParent;
                  return (
                    <div key={m.id} className="relative">
                      <SidebarButton
                        name={m.name}
                        icon={m.icon}
                        active={isActiveParent}
                        handleClick={() => toggleMenu(m.id)}
                        type="parent"
                        arrowOpen={isOpen}
                      />

                      <div
                        className={`
                                ml-4.5 xl:ml-7.5
                                border-l 
                                border-slate-300
                                px-1 pb-1
                                overflow-hidden
                                transition-all duration-500 ease-in-out
                                ${
                                  isOpen
                                    ? "max-h-100 opacity-100 translate-y-0"
                                    : "max-h-0 opacity-0 -translate-y-2"
                                }
                              `}
                      >
                        {m.children.map((child) => (
                          // <div className="flex border-l bg-blue-200">
                          <SidebarButton
                            key={child.id}
                            name={child.name}
                            path={child.path}
                            active={location.pathname === child.path}
                            handleClick={() => handleClick(child.path)}
                            type="child"
                          />
                          // </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <SidebarButton
                    key={m.id}
                    name={m.name}
                    icon={m.icon}
                    path={m.path}
                    active={location.pathname === m.path}
                    handleClick={() => handleClick(m.path)}
                  />
                );
              })}
          </div>
          {/* <div className="px-2 pb-5">
            <SidebarButton
              id="logout"
              name="Log out"
              icon="logout"
              handleClick={handleLogout}
            />
          </div> */}
        </div>
      </div>
    </>
  );
}
