import { Link, Navigate } from "react-router-dom";
import o from "../assets/bagus-with-case.png";
import Button from "../components/atoms/Button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-evenly h-screen bg-slate-100">
      <div className="flex flex-col justify-center items-center">
        <div className="flex gap-2">
          <h1 className="text-9xl font-bold text-red-600 text-shadow-lg">4</h1>
          {/* <h1 className="text-6xl font-bold text-[#A39164]">0</h1> */}
          <img
            src={o}
            alt=""
            className="w-28 -translate-y-6 animate-pendulum origin-top drop-shadow-sm"
          />
          <h1 className="text-9xl font-bold text-red-600 z-10 text-shadow-lg">
            4
          </h1>
        </div>
        <p className="text-red-600 font-semibold text-2xl">Page Not Found!</p>
      </div>

      <div className="">
        <Link
          to="/app/dashboard"
          className="px-4 py-2 bg-red-200 text-red-600 font-medium rounded-lg shadow-sm transition-all ease-in-out duration-300 hover:shadow-md hover:bg-red-600 hover:text-slate-100"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
