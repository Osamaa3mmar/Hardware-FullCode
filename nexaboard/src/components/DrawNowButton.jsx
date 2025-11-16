import { Play } from "lucide-react";

const DrawNowButton = () => {
  const handleDrawNow = () => {
    // Empty handler as per requirements
  };

  return (
    <button
      onClick={handleDrawNow}
      className="btn btn-success btn-lg gap-2 shadow-lg hover:shadow-xl transition-all"
    >
      <Play size={20} />
      Draw Now
    </button>
  );
};

export default DrawNowButton;
