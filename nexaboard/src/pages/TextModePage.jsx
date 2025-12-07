import { useState, useRef, useEffect } from "react";
import TextareaComponent from "../components/TextareaComponent";
import FontSizeSlider from "../components/FontSizeSlider";
import ColorPicker from "../components/ColorPicker";
import FontSelectorRow from "../components/FontSelectorRow";
import GenerateButton from "../components/GenerateButton";
import AddToQueueButton from "../components/AddToQueueButton";
import DrawNowButton from "../components/DrawNowButton";
import TextPreviewCanvas from "../components/TextPreviewCanvas";
import {
  convertTextToGcode,
  fetchFonts,
  fetchFont,
  previewTextBounds,
} from "../api/textApi";
import { addToQueue } from "../api/queueApi";
import { toast } from "sonner";

const TextModePage = () => {
  const [fontSize, setFontSize] = useState(5); // Default 5mm
  const [textColor, setTextColor] = useState("#ff0000");
  const [selectedFont, setSelectedFont] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fonts, setFonts] = useState([]);
  const [currentFontData, setCurrentFontData] = useState(null);
  const [previewText, setPreviewText] = useState("");
  const [textBounds, setTextBounds] = useState(null);
  const [gcode, setGcode] = useState("");
  const [stats, setStats] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const textareaRef = useRef(null);

  // Load fonts on mount
  useEffect(() => {
    async function loadFonts() {
      try {
        const fontList = await fetchFonts();
        // Filter to show only simplex font
        const simplexOnly = fontList.filter((f) => f.id === "simplex");
        setFonts(simplexOnly.length > 0 ? simplexOnly : fontList);
      } catch (err) {
        console.error("Failed to load fonts:", err);
        // Fallback fonts
        setFonts([
          {
            id: "simplex",
            name: "Hershey Simplex",
            description: "Simple thin font",
          },
          {
            id: "complex",
            name: "Hershey Complex",
            description: "Thick bold font",
          },
          {
            id: "script",
            name: "Hershey Script",
            description: "Elegant cursive",
          },
          {
            id: "sans",
            name: "Hershey Sans",
            description: "Modern sans-serif",
          },
        ]);
      }
    }
    loadFonts();
  }, []);

  // Load selected font data for preview
  useEffect(() => {
    async function loadSelectedFont() {
      if (fonts.length === 0) return;

      const selectedFontId = fonts[selectedFont]?.id || "simplex";

      try {
        const fontData = await fetchFont(selectedFontId);
        setCurrentFontData(fontData);
      } catch (err) {
        console.error("Failed to load font data:", err);
      }
    }

    loadSelectedFont();
  }, [selectedFont, fonts]);

  // Calculate text bounds for dimension display
  useEffect(() => {
    async function calculateBounds() {
      if (
        !previewText ||
        !fonts[selectedFont]?.id ||
        previewText.trim() === ""
      ) {
        setTextBounds(null);
        return;
      }

      try {
        const selectedFontId = fonts[selectedFont]?.id || "simplex";
        const bounds = await previewTextBounds({
          text: previewText,
          font: selectedFontId,
          size: fontSize,
          spacing: 0.5,
        });
        setTextBounds(bounds);
      } catch (err) {
        console.error("Failed to calculate bounds:", err);
      }
    }

    calculateBounds();
  }, [previewText, fontSize, selectedFont, fonts]);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const text = textareaRef.current?.getText();

      if (!text || text.trim() === "") {
        setError("Please enter some text first");
        setIsGenerating(false);
        return;
      }

      const selectedFontId = fonts[selectedFont]?.id || "simplex";

      const result = await convertTextToGcode({
        text,
        font: selectedFontId,
        size: fontSize,
        spacing: 0.5,
        lineSpacing: 1.5,
        feedRate: 1500,
        penUp: 5,
        penDown: -2,
        alignment: "left",
      });

      setGcode(result.gcode);
      setStats(result.stats);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error generating G-code:", err);
      setError(err.message || "Failed to generate G-code");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToQueue = async () => {
    try {
      if (!gcode) {
        toast.error("Please generate G-code first");
        return;
      }

      await addToQueue({
        gcode,
        stats,
        type: "text",
        settings: {
          font: fonts[selectedFont]?.name || "Hershey Simplex",
          size: fontSize,
          color: textColor,
        },
      });

      toast.success("Added to queue successfully!");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding to queue:", error);
      toast.error(error.message || "Failed to add to queue");
    }
  };

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
            <div className="flex flex-col items-end gap-2">
              {error && (
                <div className="alert alert-error py-2 px-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current shrink-0 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm">{error}</span>
                </div>
              )}
              <GenerateButton
                onClick={handleGenerate}
                disabled={isGenerating}
              />
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <TextareaComponent
              ref={textareaRef}
              fontSize={16}
              textColor={textColor}
              onTextChange={setPreviewText}
            />

            <div className="flex flex-col gap-4">
              {currentFontData && (
                <TextPreviewCanvas
                  text={previewText}
                  fontData={currentFontData}
                  fontSize={fontSize}
                  textColor={textColor}
                />
              )}

              {/* Dimensions Display */}
              {textBounds &&
                textBounds.width !== undefined &&
                textBounds.height !== undefined && (
                  <div
                    className={`bg-base-100 rounded-xl p-4 border-2 ${
                      textBounds.exceedsLimits
                        ? "border-error"
                        : "border-success"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className={`w-5 h-5 ${
                          textBounds.exceedsLimits
                            ? "text-error"
                            : "text-success"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      <h3 className="text-sm font-semibold">Dimensions</h3>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-base-content/70">Width:</span>
                        <span
                          className={`font-mono font-semibold ${
                            textBounds.width > (textBounds.maxWidth || 95)
                              ? "text-error"
                              : "text-success"
                          }`}
                        >
                          {textBounds.width.toFixed(1)} /{" "}
                          {textBounds.maxWidth || 95} mm
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-base-content/70">Height:</span>
                        <span
                          className={`font-mono font-semibold ${
                            textBounds.height > (textBounds.maxHeight || 130)
                              ? "text-error"
                              : "text-success"
                          }`}
                        >
                          {textBounds.height.toFixed(1)} /{" "}
                          {textBounds.maxHeight || 130} mm
                        </span>
                      </div>
                      {textBounds.exceedsLimits && (
                        <div className="mt-2 pt-2 border-t border-error/20">
                          <p className="text-error text-xs">
                            ⚠️ Text exceeds CNC limits! Reduce font size or text
                            length.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>
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
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Lines:</span>
                  <span className="badge badge-primary">
                    {stats?.lines || 0}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Paths:</span>
                  <span className="badge badge-secondary">
                    {stats?.paths || 0}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Characters:</span>
                  <span className="badge badge-accent">
                    {stats?.characters || 0}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Distance:</span>
                  <span className="badge badge-info">
                    {typeof stats?.distance === "number"
                      ? stats.distance.toFixed(1)
                      : stats?.distance || 0}{" "}
                    mm
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Est. Time:</span>
                  <span className="badge badge-success">
                    {typeof stats?.estimatedTime === "number"
                      ? stats.estimatedTime.toFixed(1)
                      : stats?.estimatedTime || 0}
                    s
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Size:</span>
                  <span className="badge badge-warning">
                    {typeof stats?.size?.width === "number"
                      ? stats.size.width.toFixed(1)
                      : stats?.size?.width || 0}{" "}
                    ×{" "}
                    {typeof stats?.size?.height === "number"
                      ? stats.size.height.toFixed(1)
                      : stats?.size?.height || 0}{" "}
                    mm
                  </span>
                </div>
              </div>
            </div>

            {/* G-code Textarea */}
            <div className="flex-1 p-6 overflow-hidden">
              <textarea
                className="textarea textarea-bordered w-full h-full font-mono text-sm resize-none bg-base-200 focus:outline-none focus:border-primary"
                placeholder="G-code will appear here..."
                value={gcode}
                readOnly
              ></textarea>
            </div>

            {/* Modal Footer with Action Buttons */}
            <div className="px-6 py-4 bg-base-200 border-t border-base-300">
              <div className="flex gap-3 justify-end">
                <AddToQueueButton onClick={handleAddToQueue} />
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
