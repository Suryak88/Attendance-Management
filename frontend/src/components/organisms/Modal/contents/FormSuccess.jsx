import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import Button from "../../../atoms/Button";
import Checkmark from "../../../../assets/Checkmark.lottie";

export default function FormSuccess({ onSubmit, btnLabel }) {
  return (
    <div className="z-10 flex flex-col justify-center items-center my-auto w-full max-h-full overflow-hidden transition-all duration-300">
      <div className="overflow-clip max-w-sm flex justify-center items-center flex-1 mx-auto">
        <DotLottieReact
          src={Checkmark}
          autoplay
          loop={false}
          className="absolute origin-center scale-150"
        />
        <div className="opacity-0 h-42 lg:h-49 lg:w-80">.</div>
      </div>
    </div>
  );
}
