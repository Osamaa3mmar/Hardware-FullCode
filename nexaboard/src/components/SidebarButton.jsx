const SidebarButton = ({ label, icon, onClick, isCollapsed, isActive }) => {
  return (
    <button
      onClick={onClick}
      className={`btn w-full gap-3 transition-all duration-200 ${
        isCollapsed ? "justify-center px-2" : "justify-start pl-4"
      } ${
        isActive
          ? "btn-primary shadow-lg scale-105 border-primary"
          : "btn-ghost opacity-70 hover:opacity-100 hover:bg-base-300 hover:scale-102 hover:shadow-md"
      }`}
    >
      <span className={isActive ? "animate-pulse" : ""}>{icon}</span>
      {!isCollapsed && <span className="font-medium">{label}</span>}
    </button>
  );
};

export default SidebarButton;
