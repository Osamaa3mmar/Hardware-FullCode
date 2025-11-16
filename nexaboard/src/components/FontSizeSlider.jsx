const FontSizeSlider = ({ fontSize, setFontSize }) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-base-content/60">Small</span>
        <div className="badge badge-primary badge-lg px-5 py-4 text-lg font-bold">
          {fontSize}px
        </div>
        <span className="text-sm font-medium text-base-content/60">Large</span>
      </div>
      <input
        type="range"
        min="12"
        max="48"
        value={fontSize}
        onChange={(e) => setFontSize(Number(e.target.value))}
        className="range range-primary range-lg"
      />
      <div className="flex justify-between px-1">
        <span className="text-xs text-base-content/40">12px</span>
        <span className="text-xs text-base-content/40">30px</span>
        <span className="text-xs text-base-content/40">48px</span>
      </div>
    </div>
  );
};

export default FontSizeSlider;
