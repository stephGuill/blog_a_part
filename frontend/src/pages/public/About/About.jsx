import { useTranslation } from "react-i18next";

const methodSteps = ["tooling", "layout", "views", "structure"];
const cards = ["structure", "design", "evolution"];

function About() {
  const { t } = useTranslation();

  return (
    <section className="section">
      <div className="detail-grid">
        <div>
          <div className="eyebrow">{t("nav.about")}</div>
          <h1 className="page-title">{t("pages.about.title")}</h1>
          <p className="lead">{t("pages.about.description")}</p>
        </div>

        <aside className="panel">
          <div className="card-kicker">{t("pages.about.method")}</div>
          <ol className="meta-list">
            {methodSteps.map((stepKey, index) => (
              <li key={stepKey}>
                {index + 1}. {t(`pages.about.methodSteps.${stepKey}`)}
              </li>
            ))}
          </ol>
        </aside>
      </div>

      <div className="card-grid">
        {cards.map((cardKey) => (
          <article className="content-card" key={cardKey}>
            <h2 className="card-title">{t(`pages.about.cards.${cardKey}.title`)}</h2>
            <p>{t(`pages.about.cards.${cardKey}.text`)}</p>
          </article>
        ))}
      </div>

      <div className="content-card" style={{ marginTop: 36 }}>
        <div className="card-kicker">{t("pages.about.visibleStack")}</div>
        <div className="chip-row" style={{ marginTop: 18 }}>
          <span className="chip chip--dark">React 18</span>
          <span className="chip chip--dark">{t("footer.reactRouter")}</span>
          <span className="chip chip--dark">Tailwind CSS v4</span>
          <span className="chip chip--dark">API REST Node/Express</span>
        </div>
      </div>
    </section>
  );
}

export default About;
