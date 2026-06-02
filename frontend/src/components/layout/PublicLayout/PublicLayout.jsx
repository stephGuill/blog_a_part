import { Outlet } from "react-router-dom";

import Footer from "../Footer/Footer";
import Header from "../Header/Header";

function PublicLayout() {
  return (
    <div className="page-shell">
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default PublicLayout;
