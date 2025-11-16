const GenerateButton = () => {
  const handleGenerate = () => {
    
  };

  return (
    <button
      onClick={handleGenerate}
      className="btn btn-success btn-lg gap-2 shadow-lg hover:shadow-xl transition-all"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      Generate
    </button>
  );
};

export default GenerateButton;
