const FontSelectorRow = ({ selectedFont, setSelectedFont }) => {
  const fonts = ['Arial', 'Times', 'Courier', 'Verdana'];

  return (
    <div className="flex gap-3 flex-wrap">
      {fonts.map((font, index) => (
        <div
          key={index}
          onClick={() => setSelectedFont(index)}
          className={`w-28 h-28 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
            selectedFont === index
              ? 'bg-primary border-2 border-primary ring-4 ring-primary/20 scale-105'
              : 'bg-base-300 border-2 border-base-400 hover:bg-base-400 hover:border-primary/50 hover:scale-102'
          }`}
        >
          <span className={`text-base font-semibold ${
            selectedFont === index ? 'text-primary-content' : 'text-base-content'
          }`}>
            {font}
          </span>
        </div>
      ))}
    </div>
  );
};

export default FontSelectorRow;
