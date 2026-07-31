import { FloatingPortal } from "@floating-ui/react";
import BtnLoading from "../../atoms/BtnLoading";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Download, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
export default function AttachmentPreview({ open, onClose, file, loading }) {
  function handleDownload() {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.originName;
    link.click();
  }

  return (
    <FloatingPortal>
      <div
        className={`fixed inset-0 flex items-center justify-center bg-black/50 ignore-popup-close z-999 transition-all duration-300 ease-in-out 
        ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      >
        {file?.mime?.startsWith("image/") ? (
          loading ? (
            <BtnLoading />
          ) : (
            <div
              onClick={(e) => e.stopPropagation()}
              className="overflow-hidden rounded-lg relative"
            >
              <TransformWrapper initialScale={1} wheel={{ step: 0.01 }}>
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <TransformComponent>
                      <img
                        src={file?.url}
                        onClick={(e) => e.stopPropagation()}
                        className="max-h-[75vh] max-w-[75vw] rounded-lg shadow-2xl object-contain"
                      />
                    </TransformComponent>
                    <div className="absolute bottom-0 flex gap-2 py-1 px-2 rounded-lg bg-slate-200 shadow-md m-1 transition-all z-50">
                      <div className="flex items-center gap-1 lg:gap-1.5 text-slate-700">
                        <button
                          title="Zoom in"
                          type="button"
                          className="group hover:bg-slate-300 py-0.5 px-1 rounded-lg transition-all cursor-pointer"
                          onClick={() => zoomIn(0.5)}
                        >
                          <ZoomIn className="size-6 lg:size-7 group-hover:scale-115 transition" />
                        </button>
                        <button
                          title="Zoom out"
                          type="button"
                          className="group hover:bg-slate-300 py-0.5 px-1 rounded-lg transition-all cursor-pointer"
                          onClick={() => zoomOut(0.5)}
                        >
                          <ZoomOut
                            title="Zoom out"
                            className="size-6 lg:size-7 group-hover:scale-85 transition"
                          />
                        </button>
                      </div>

                      <div className="border-l border-slate-300 shadow-sm" />

                      <div className="flex items-center gap-1 lg:gap-1.5 text-slate-700">
                        <button
                          title="Reset"
                          type="button"
                          className="group hover:bg-slate-300 py-0.5 px-1 rounded-lg transition-all cursor-pointer"
                          onClick={() => resetTransform(300, "easeOutQuint")}
                        >
                          <RotateCcw className="size-6 lg:size-7" />
                        </button>
                        <button
                          title="Download"
                          type="button"
                          className="group hover:bg-slate-300 py-0.5 px-1 rounded-lg transition-all cursor-pointer"
                          onClick={handleDownload}
                        >
                          <Download className="size-6 lg:size-7" />
                        </button>
                      </div>
                    </div>
                    <div
                      title="Close preview"
                      className="absolute top-1 right-1 group cursor-pointer select-none  "
                      onClick={onClose}
                    >
                      <X className="transition-all duration-200 text-red-900 group-hover:text-red-600" />
                    </div>
                  </>
                )}
              </TransformWrapper>
            </div>
          )
        ) : loading ? (
          <BtnLoading />
        ) : (
          <iframe
            src={file?.url}
            className="w-[80vw] md:w-[60vw] h-[70vh] md:h-[85vh] rounded-lg"
            title="Medical Certificate Preview"
          />
        )}
      </div>
    </FloatingPortal>
  );
}
