import { Route, Routes } from "react-router-dom";

import ProtectedRoute from "@components/auth/ProtectedRoute";
import RoleRoute from "@components/auth/RoleRoute";
import DashboardLayout from "@components/layout/DashboardLayout/DashboardLayout";
import PublicLayout from "@components/layout/PublicLayout/PublicLayout";
import AdminBlogs from "@pages/admin/AdminBlogs/AdminBlogs";
import AdminDashboard from "@pages/admin/AdminDashboard/AdminDashboard";
import AdminReports from "@pages/admin/AdminReports/AdminReports";
import AdminThemes from "@pages/admin/AdminThemes/AdminThemes";
import AdminUsers from "@pages/admin/AdminUsers/AdminUsers";
import ForgotPassword from "@pages/auth/ForgotPassword/ForgotPassword";
import Signin from "@pages/auth/Signin/Signin";
import Signup from "@pages/auth/Signup/Signup";
import Dashboard from "@pages/dashboard/Dashboard/Dashboard";
import Profile from "@pages/dashboard/Profile/Profile";
import Settings from "@pages/dashboard/Settings/Settings";
import EditorDashboard from "@pages/editor/EditorDashboard/EditorDashboard";
import PostCreate from "@pages/editor/PostCreate/PostCreate";
import PostEdit from "@pages/editor/PostEdit/PostEdit";
import PostsList from "@pages/editor/PostsList/PostsList";
import Forbidden from "@pages/errors/Forbidden/Forbidden";
import NotFound from "@pages/errors/NotFound/NotFound";
import LegalNotice from "@pages/legal/LegalNotice";
import PrivacyPolicy from "@pages/legal/PrivacyPolicy";
import TermsOfUse from "@pages/legal/TermsOfUse";
import CommentsModeration from "@pages/moderator/CommentsModeration/CommentsModeration";
import ModeratorDashboard from "@pages/moderator/ModeratorDashboard/ModeratorDashboard";
import BlogBuilder from "@pages/owner/BlogBuilder/BlogBuilder";
import OwnerBlogs from "@pages/owner/OwnerBlogs/OwnerBlogs";
import OwnerDashboard from "@pages/owner/OwnerDashboard/OwnerDashboard";
import ThemeCustomizer from "@pages/owner/ThemeCustomizer/ThemeCustomizer";
import About from "@pages/public/About/About";
import BlogDetail from "@pages/public/BlogDetail/BlogDetail";
import BlogExplore from "@pages/public/BlogExplore/BlogExplore";
import Contact from "@pages/public/Contact/Contact";
import Features from "@pages/public/Features/Features";
import Home from "@pages/public/Home/Home";
import PostDetail from "@pages/public/PostDetail/PostDetail";
import Pricing from "@pages/public/Pricing/Pricing";

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/blogs" element={<BlogExplore />} />
        <Route path="/blogs/:id" element={<BlogDetail />} />
        <Route path="/posts/:id" element={<PostDetail />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/features" element={<Features />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/mentions-legales" element={<LegalNotice />} />
        <Route path="/conditions-utilisation" element={<TermsOfUse />} />
        <Route path="/politique-confidentialite" element={<PrivacyPolicy />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* FR: Le profil simple user reste dans le front public sous forme de modal.
            EN: The plain user profile stays in the public frontend as a modal. */}
        <Route path="/profile" element={<ProtectedRoute><Profile presentation="modal" /></ProtectedRoute>} />
        <Route path="/forbidden" element={<Forbidden />} />
        <Route path="/403" element={<Forbidden />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route element={<DashboardLayout />}>
        {/* FR: Les routes dashboard excluent le role user simple.
            EN: Dashboard routes exclude the plain user role. */}
        <Route path="/dashboard" element={<RoleRoute allowedRoles={["admin", "owner", "editor", "moderator"]}><Dashboard /></RoleRoute>} />
        <Route path="/dashboard/profile" element={<RoleRoute allowedRoles={["admin", "owner", "editor", "moderator"]}><Profile /></RoleRoute>} />
        <Route path="/dashboard/settings" element={<RoleRoute allowedRoles={["admin", "owner", "editor", "moderator"]}><Settings /></RoleRoute>} />
        <Route path="/admin" element={<RoleRoute allowedRoles={["admin"]}><AdminDashboard /></RoleRoute>} />
        <Route path="/admin/users" element={<RoleRoute allowedRoles={["admin"]}><AdminUsers /></RoleRoute>} />
        <Route path="/admin/blogs" element={<RoleRoute allowedRoles={["admin"]}><AdminBlogs /></RoleRoute>} />
        <Route path="/admin/themes" element={<RoleRoute allowedRoles={["admin"]}><AdminThemes /></RoleRoute>} />
        <Route path="/admin/reports" element={<RoleRoute allowedRoles={["admin"]}><AdminReports /></RoleRoute>} />
        <Route path="/owner" element={<RoleRoute allowedRoles={["admin", "owner"]}><OwnerDashboard /></RoleRoute>} />
        <Route path="/owner/blogs" element={<RoleRoute allowedRoles={["admin", "owner"]}><OwnerBlogs /></RoleRoute>} />
        <Route path="/owner/builder" element={<RoleRoute allowedRoles={["admin", "owner"]}><BlogBuilder /></RoleRoute>} />
        <Route path="/owner/theme" element={<RoleRoute allowedRoles={["admin", "owner"]}><ThemeCustomizer /></RoleRoute>} />
        <Route path="/owner/themes" element={<RoleRoute allowedRoles={["admin", "owner"]}><ThemeCustomizer /></RoleRoute>} />
        <Route path="/editor" element={<RoleRoute allowedRoles={["admin", "editor"]}><EditorDashboard /></RoleRoute>} />
        <Route path="/editor/posts" element={<RoleRoute allowedRoles={["admin", "editor"]}><PostsList /></RoleRoute>} />
        <Route path="/editor/posts/create" element={<RoleRoute allowedRoles={["admin", "editor"]}><PostCreate /></RoleRoute>} />
        <Route path="/editor/posts/:id/edit" element={<RoleRoute allowedRoles={["admin", "editor"]}><PostEdit /></RoleRoute>} />
        <Route path="/moderator" element={<RoleRoute allowedRoles={["admin", "moderator"]}><ModeratorDashboard /></RoleRoute>} />
        <Route path="/moderator/comments" element={<RoleRoute allowedRoles={["admin", "moderator"]}><CommentsModeration /></RoleRoute>} />
      </Route>
    </Routes>
  );
}

export default App;
