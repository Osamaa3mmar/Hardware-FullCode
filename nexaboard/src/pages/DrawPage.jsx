import { useState, useRef } from "react";
import { FabricImage, FabricText, PencilBrush } from "fabric";
import DrawingBoard from "../components/draw/DrawingBoard";
import Toolbar from "../components/draw/Toolbar";
import GenerateButton from "../components/GenerateButton";
import AddToQueueButton from "../components/AddToQueueButton";
import DrawNowButton from "../components/DrawNowButton";

const DrawPage = () => {
  const canvasRef = useRef(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isEraserMode, setIsEraserMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gcode, setGcode] = useState("");

  const handleCanvasReady = (canvas) => {
    // Set initial brush
    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = selectedColor;
    canvas.freeDrawingBrush.width = 2;
  };

  const handleFreeDrawClick = () => {
    if (!canvasRef.current) return;

    const newDrawingMode = !isDrawingMode;
    setIsDrawingMode(newDrawingMode);
    setIsEraserMode(false);

    canvasRef.current.isDrawingMode = newDrawingMode;
    if (newDrawingMode) {
      canvasRef.current.freeDrawingBrush = new PencilBrush(canvasRef.current);
      canvasRef.current.freeDrawingBrush.color = selectedColor;
      canvasRef.current.freeDrawingBrush.width = 2;
    }
  };

  const handleEraseClick = () => {
    if (!canvasRef.current) return;

    const newEraserMode = !isEraserMode;
    setIsEraserMode(newEraserMode);
    setIsDrawingMode(false);

    if (newEraserMode) {
      canvasRef.current.isDrawingMode = true;
      const brush = new PencilBrush(canvasRef.current);
      brush.width = 10;
      brush.color = "#ffffff"; // Use white color to erase
      canvasRef.current.freeDrawingBrush = brush;
    } else {
      canvasRef.current.isDrawingMode = false;
    }
  };

  const handleAddText = () => {
    if (!canvasRef.current) return;

    const text = new FabricText("Double click to edit", {
      left: 100,
      top: 100,
      fontSize: 24,
      fill: selectedColor,
      fontFamily: "Arial",
    });

    canvasRef.current.add(text);
    canvasRef.current.setActiveObject(text);
    canvasRef.current.renderAll();
  };

  const handleAddImage = (imageUrl) => {
    if (!canvasRef.current) return;

    FabricImage.fromURL(imageUrl).then((img) => {
      img.scale(0.5);
      img.set({
        left: 50,
        top: 50,
      });
      canvasRef.current.add(img);
      canvasRef.current.renderAll();
    });
  };

  const handleColorChange = (color) => {
    setSelectedColor(color);
    if (!canvasRef.current) return;

    if (canvasRef.current.isDrawingMode && !isEraserMode) {
      canvasRef.current.freeDrawingBrush.color = color;
    }

    const activeObject = canvasRef.current.getActiveObject();
    if (activeObject && activeObject.type === "i-text") {
      activeObject.set("fill", color);
      canvasRef.current.renderAll();
    }
  };

  const handleClearBoard = () => {
    if (!canvasRef.current) return;
    canvasRef.current.clear();
    canvasRef.current.backgroundColor = "#ffffff";
    canvasRef.current.renderAll();
  };

  const handleGenerate = () => {
    if (!canvasRef.current) return;

    // Simple G-code generation (you can expand this)
    const objects = canvasRef.current.getObjects();
    let generatedGcode =
      "; Drawing G-code\nG21 ; Set units to millimeters\nG90 ; Absolute positioning\n";

    generatedGcode += `; Total objects: ${objects.length}\n`;
    generatedGcode += "G0 Z5 ; Lift pen\n";
    generatedGcode += "G0 X0 Y0 ; Move to origin\n";

    setGcode(generatedGcode);
    setIsModalOpen(true);
  };

  return (
    <div className="w-full h-full p-8 overflow-auto bg-base-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Tools Section */}
        <div className="bg-base-200 rounded-2xl p-8 shadow-xl border border-base-300">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-primary/20">
            <div className="w-1 h-8 bg-primary rounded-full"></div>
            <h2 className="text-3xl font-bold">Drawing Tools</h2>
          </div>

          <Toolbar
            isDrawingMode={isDrawingMode}
            isEraserMode={isEraserMode}
            selectedColor={selectedColor}
            onFreeDrawClick={handleFreeDrawClick}
            onEraseClick={handleEraseClick}
            onAddTextClick={handleAddText}
            onAddImageClick={handleAddImage}
            onColorChange={handleColorChange}
            onClearBoard={handleClearBoard}
          />
        </div>

        {/* Canvas Section */}
        <div className="bg-base-200 rounded-2xl p-8 shadow-xl border border-base-300">
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-primary rounded-full"></div>
              <h2 className="text-3xl font-bold">Canvas</h2>
            </div>
            <GenerateButton onClick={handleGenerate} />
          </div>

          <DrawingBoard
            canvasRef={canvasRef}
            onCanvasReady={handleCanvasReady}
          />
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
                  <span className="badge badge-primary">
                    {gcode.split("\n").length}
                  </span>
                </div>
              </div>
            </div>

            {/* G-code Textarea */}
            <div className="flex-1 p-6 overflow-hidden">
              <textarea
                className="textarea textarea-bordered w-full h-full font-mono text-sm resize-none bg-base-200 focus:outline-none focus:border-primary"
                value={gcode}
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

export default DrawPage;
