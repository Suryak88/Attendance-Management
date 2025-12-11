import { useContext } from "react";
import { useEffect } from "react";
import { useRef, useState } from "react";
import { AuthContext } from "../../../context/AuthContext";

export default function Header({ isExpand, handleExpand }) {
  const { user } = useContext(AuthContext);
  const [search, setSearch] = useState("");
  const [greeting, setGreeting] = useState("");
  const inputRef = useRef(null);

  function handleClear() {
    setSearch("");
  }

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  function getGreeting() {
    const hour = new Date().getHours();

    if (hour >= 0 && hour < 11) return "Good Morning";
    if (hour >= 11 && hour < 15) return "Good Afternoon";
    if (hour >= 15 && hour < 19) return "Good Evening";
    return "Good Night";
  }

  return (
    <>
      <div className="flex flex-row">
        <div
          className={`lg:hidden flex w-13 h-13 md:w-16 md:h-16 rounded-xl mx-2 bg-slate-100 shadow-md`}
        >
          <span
            className="material-symbols-outlined m-auto text-xl! md:text-[27px]! select-none cursor-pointer"
            onClick={handleExpand}
          >
            menu
          </span>
        </div>

        <div className="w-full h-13 md:h-16 rounded-xl flex justify-between bg-slate-100 shadow-md">
          <div className="flex w-1/2 lg:w-1/2 xl:w-xl ml-2 md:ml-5 my-auto rounded-lg md:rounded-xl bg-gray-200">
            <span
              className="material-symbols-outlined py-1 pl-2 pr-1 text-[20px]! md:text-[24px]! my-auto"
              onClick={() => inputRef.current?.focus()}
            >
              search
            </span>

            <input
              ref={inputRef}
              type="text"
              name="search"
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search here .."
              className="md:w-1/2 w-1/3 md:px-1 peer focus:outline-none grow text-sm lg:text-base"
            />

            <span
              className={`material-symbols-outlined p-1 hover:bg-slate-300 cursor-pointer rounded-xl
            ${search ? "visible" : "invisible"}`}
              onClick={handleClear}
            >
              close
            </span>
          </div>

          <div className="flex items-center md:gap-2">
            <div className="flex text-right md:text-center text-xs md:text-sm lg:text-base">
              {greeting}, {user.username}!
            </div>

            <div className="mx-2 md:mx-5 w-10 md:w-24 max-h-full my-auto flex">
              <label
                htmlFor=""
                className="max-w-full -translate-y-1 md:-translate-y-1/4 text-xs text-center md:text-sm lg:text-base"
              >
                <span className="material-symbols-outlined py-1 px-2 translate-y-1/7 md:translate-y-1/4 text-[20px]! md:text-[24px]!">
                  light_mode
                </span>
                Light
              </label>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
