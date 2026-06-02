import { Outlet } from "react-router-dom";
import { useState } from "react";

import Sidebar from "../Sidebar/Sidebar";
import Topbar from "../Topbar/Topbar";
import "./DashboardLayout.css";

function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className={`dashboard-layout ${isSidebarOpen ? "is-sidebar-open" : "is-sidebar-compact"}`}>
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((current) => !current)}
      />
      <main className="dashboard-main">
        <Topbar />
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
