import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FloatingInput from "../components/atoms/FloatingInput";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";
import ModalPanel from "../components/organisms/Modal/modalPanel";
import FormContent from "../components/organisms/Modal/contents/FormContent";
import Button from "../components/atoms/Button";
import api from "../utils/axiosInstance";
import logo from "../assets/logo.png";
import { toast } from "sonner";
import { useEffect } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [fail, setFail] = useState(false);

  useEffect(() => {
    const message = sessionStorage.getItem("SESSION_EXPIRED");

    if (message) {
      toast.warning(message);
      sessionStorage.removeItem("SESSION_EXPIRED");
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // const res = await axios.post(
      //   "http://localhost:5000/api/users/login",
      //   {
      //     username,
      //     password,
      //   },
      //   { withCredentials: true },
      // );
      const res = await api.post("/users/login", {
        username,
        password,
      });
      login(res.data.user, res.data.accessToken);
      navigate("/app/dashboard");
    } catch (error) {
      console.error(error);
      setFail(true);
      // toast.error("Login Failed!");
    }
  };

  return (
    <>
      <div className="h-screen flex flex-col lg:flex-row bg-linear-to-tr from-red-500  via-red-200 via-40% to-red-600 sm:overflow-auto">
        <div className="w-screen lg:w-1/2 h-auto flex flex-col items-center justify-center bg-cover bg-center text-white">
          <img
            src={logo}
            alt="Bagus Group"
            className="p-3 mt-5 w-36 md:w-48 md:mt-10 lg:w-64 xl:w-84 mb-3 z-10"
          />
          <h3 className="text-sm lg:text-lg lg:mt-2 text-slate-800 font-bold uppercase tracking-widest">
            Attendance Management
          </h3>
        </div>
        {/* <div className="text-xl font-bold text-slate-800 mx-auto w-3/4 md:w-2/3 lg:w-1/2 h-auto md:h-128 lg:h-auto md:bg-slate-200 flex rounded-xl my-24 lg:my-8 lg:mr-8 lg:shadow-md"> */}
        <div className="text-xl font-bold text-slate-800 mx-auto w-3/4 md:w-2/3 lg:w-1/2 h-auto md:h-128 lg:h-auto md:bg-slate-200 flex justify-center items-center rounded-xl my-24 lg:my-8 lg:mr-8 lg:shadow-md">
          <div className="w-full lg:w-fit ">
            <ModalPanel title={"Welcome back!"}>
              <div className="mt-2 lg:mt-5 w-full">
                <FormContent onSubmit={handleLogin} btnLabel={"Log In"}>
                  <div className="w-full md:w-1/2 lg:w-80">
                    <div className="flex flex-col gap-4">
                      <FloatingInput
                        id="username"
                        value={username}
                        onValueChange={setUsername}
                        message={"Please enter your username"}
                        border="border-2"
                        fontThickness="font-medium"
                      />
                      <FloatingInput
                        id="password"
                        type="password"
                        value={password}
                        onValueChange={setPassword}
                        message={"Please enter your password"}
                        border="border-2"
                        fontThickness="font-medium"
                        autoComplete="current-password"
                      />
                    </div>

                    <div className="flex flex-col mt-4 md:mt-2 lg:mt-4">
                      <div
                        className={`font-medium text-red-500 text-base flex justify-center transition-transform duration-500 ease-in-out animate-bounce ${fail ? "opacity-100 -translate-y-1" : "opacity-0 translate-y-4"}`}
                      >
                        <p className="text-center">
                          Username or Password is invalid!
                        </p>
                      </div>

                      <div className="flex justify-center mt-1 mx-auto sm:w-1/3 md:w-full">
                        <Button btnLabel={"Log In"} />
                      </div>
                    </div>
                  </div>
                </FormContent>
              </div>
            </ModalPanel>
          </div>
        </div>
      </div>
    </>
  );
}
