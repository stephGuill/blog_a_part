import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import "./QuickActions.css";

function QuickActions() {
  const { t } = useTranslation();

  return (
    <div className="actions">
      <Link className="button button--primary" to="/editor/posts/create">{t("actions.newPost")}</Link>
      <Link className="button" to="/owner/blogs">{t("nav.myBlogs")}</Link>
    </div>
  );
}

export default QuickActions;
