import { useState } from "react";
import TextareaComponent from "../components/TextareaComponent";
import FontSizeSlider from "../components/FontSizeSlider";
import ColorPicker from "../components/ColorPicker";
import FontSelectorRow from "../components/FontSelectorRow";
import GenerateButton from "../components/GenerateButton";
import AddToQueueButton from "../components/AddToQueueButton";
import DrawNowButton from "../components/DrawNowButton";

const TextModePage = () => {
  const [fontSize, setFontSize] = useState(16);
  const [textColor, setTextColor] = useState("#ff0000");
  const [selectedFont, setSelectedFont] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="w-full h-full p-8 overflow-auto bg-base-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Settings Section */}
        <div className="bg-base-200 rounded-2xl p-8 shadow-xl border border-base-300">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-primary/20">
            <div className="w-1 h-8 bg-primary rounded-full"></div>
            <h2 className="text-3xl font-bold">Text Settings</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Font Size */}
            <div className="bg-base-100 rounded-xl p-6 border-2 border-base-300 hover:border-primary/50 transition-all">
              <div className="flex items-center gap-2 mb-5 pb-3 border-b border-base-300">
                <svg
                  className="w-5 h-5 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10M12 3v18m-7-4h14"
                  />
                </svg>
                <h3 className="text-lg font-semibold">Font Size</h3>
              </div>
              <FontSizeSlider fontSize={fontSize} setFontSize={setFontSize} />
            </div>

            {/* Color Picker */}
            <div className="bg-base-100 rounded-xl p-6 border-2 border-base-300 hover:border-primary/50 transition-all">
              <div className="flex items-center gap-2 mb-5 pb-3 border-b border-base-300">
                <svg
                  className="w-5 h-5 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
                <h3 className="text-lg font-semibold">Text Color</h3>
              </div>
              <ColorPicker textColor={textColor} setTextColor={setTextColor} />
            </div>

            {/* Font Selection */}
            <div className="bg-base-100 rounded-xl p-6 border-2 border-base-300 hover:border-primary/50 transition-all lg:col-span-1">
              <div className="flex items-center gap-2 mb-5 pb-3 border-b border-base-300">
                <svg
                  className="w-5 h-5 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                  />
                </svg>
                <h3 className="text-lg font-semibold">Font Style</h3>
              </div>
              <FontSelectorRow
                selectedFont={selectedFont}
                setSelectedFont={setSelectedFont}
              />
            </div>
          </div>
        </div>

        {/* Text Input Section */}
        <div className="bg-base-200 rounded-2xl p-8 shadow-xl border border-base-300">
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-primary rounded-full"></div>
              <h2 className="text-3xl font-bold">Text Input</h2>
            </div>
            <GenerateButton onClick={() => setIsModalOpen(true)} />
          </div>

          <div className="flex justify-center">
            <TextareaComponent fontSize={fontSize} textColor={textColor} />
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-5xl h-[85vh] flex flex-col p-0 bg-base-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-base-300">
              <div>
                <h3 className="font-bold text-2xl">G-code Preview</h3>
                <p className="text-sm text-base-content/60 mt-1">
                  Review and manage your generated G-code
                </p>
              </div>
              <button
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => setIsModalOpen(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* G-code Info */}
            <div className="px-6 py-3 bg-base-200 border-b border-base-300">
              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Lines:</span>
                  <span className="badge badge-primary">0</span>
                </div>
              </div>
            </div>

            {/* G-code Textarea */}
            <div className="flex-1 p-6 overflow-hidden">
              <textarea
                className="textarea textarea-bordered w-full h-full font-mono text-sm resize-none bg-base-200 focus:outline-none focus:border-primary"
                placeholder="G-code will appear here..."
                readOnly
              ></textarea>
            </div>

            {/* Modal Footer with Action Buttons */}
            <div className="px-6 py-4 bg-base-200 border-t border-base-300">
              <div className="flex gap-3 justify-end">
                <AddToQueueButton />
                <DrawNowButton />
              </div>
            </div>
          </div>
          <div
            className="modal-backdrop bg-black/60"
            onClick={() => setIsModalOpen(false)}
          ></div>
        </div>
      )}
    </div>
  );
};

export default TextModePage;
