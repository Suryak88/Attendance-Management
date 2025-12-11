import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FloatingInput from "../components/atoms/FloatingInput";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";
import ModalPanel from "../components/organisms/Modal/modalPanel";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:5000/api/users/login",
        {
          username,
          password,
        },
        { withCredentials: true }
      );
      // localStorage.setItem("token", res.data.accessToken);
      // localStorage.setItem("user", JSON.stringify(res.data.user));
      login(res.data.user, res.data.accessToken);
      navigate("/app/dashboard");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Login gagal");
    }
  };

  return (
    <>
      <div className="h-screen flex flex-col lg:flex-row bg-linear-to-tr from-red-500  via-red-200 via-40% to-red-600 sm:overflow-auto">
        <div className="w-screen lg:w-1/2 h-auto flex flex-col items-center justify-center bg-cover bg-center text-white">
          <img
            src="img/logo.png"
            alt="Bagus Group"
            className="p-3 mt-5 w-36 md:w-48 md:mt-10 lg:w-64 xl:w-84 mb-3 z-10"
          />
          <h3 className="text-sm lg:text-lg lg:mt-2 text-slate-800 font-bold uppercase tracking-widest">
            Attendance Management
          </h3>
        </div>
        {/* <div className="text-xl font-bold text-slate-800 mx-auto w-3/4 md:w-2/3 lg:w-1/2 h-auto md:h-128 lg:h-auto md:bg-slate-200 flex rounded-xl my-24 lg:my-8 lg:mr-8 lg:shadow-md"> */}
        <div className="text-xl font-bold text-slate-800 mx-auto w-3/4 md:w-2/3 lg:w-1/2 h-auto md:h-128 lg:h-auto md:bg-slate-200 flex rounded-xl my-24 lg:my-8 lg:mr-8 lg:shadow-md">
          <ModalPanel
            title={"Welcome back!"}
            onSubmit={handleLogin}
            btnLabel={"Log In"}
            mode={"form"}
          >
            <FloatingInput
              id="username"
              value={username}
              onValueChange={setUsername}
              message={"Please enter your username"}
            />
            <FloatingInput
              id="password"
              type="password"
              value={password}
              onValueChange={setPassword}
              message={"Please enter your password"}
            />
          </ModalPanel>
        </div>
      </div>
    </>
  );
}
