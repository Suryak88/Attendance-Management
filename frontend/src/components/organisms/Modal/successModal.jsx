import Modal from ".";
import ModalPanel from "./modalPanel";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function SucessModal() {
  <Modal openModal={open} onClose={onClose}>
    <ModalPanel
      title={"Succesfull!"}
      onSubmit={onClose}
      btnLabel={"OK!"}
      handleClose={onClose}
      mode={"success"}
    >
      <div className="overflow-clip max-w-sm flex justify-center items-center w-fit h-fit mx-auto">
        <DotLottieReact
          src="/animation/Checkmark.lottie"
          autoplay
          loop
          className="origin-center scale-150"
        />
      </div>
    </ModalPanel>
  </Modal>;
}
