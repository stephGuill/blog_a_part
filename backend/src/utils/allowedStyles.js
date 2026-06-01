const ALLOWED_STYLE_PROPERTIES = Object.freeze([
  "alignItems",
  "backgroundColor",
  "backgroundOpacity",
  "borderColor",
  "borderRadius",
  "borderWidth",
  "color",
  "display",
  "flexDirection",
  "flexWrap",
  "fontSize",
  "fontWeight",
  "gap",
  "gridTemplateColumns",
  "gridTemplateRows",
  "height",
  "justifyContent",
  "margin",
  "maxWidth",
  "minHeight",
  "opacity",
  "padding",
  "textAlign",
  "width",
]);

const ALLOWED_DISPLAY_VALUES = Object.freeze(["block", "inline-block", "grid", "flex", "none"]);
const ALLOWED_TEXT_ALIGN_VALUES = Object.freeze(["left", "center", "right", "justify"]);

const COLOR_PATTERN = /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|transparent|currentColor)$/;
const CSS_SIZE_PATTERN = /^-?\d+(\.\d+)?(px|rem|em|%|vh|vw)?$/;

function sanitizeStyleJson(style = {}) {
  if (!style || typeof style !== "object" || Array.isArray(style)) {
    return {};
  }

  return Object.entries(style).reduce((safeStyle, [key, value]) => {
    if (!ALLOWED_STYLE_PROPERTIES.includes(key)) {
      return safeStyle;
    }

    if (["opacity", "backgroundOpacity"].includes(key)) {
      const opacity = Number(value);
      if (!Number.isNaN(opacity) && opacity >= 0 && opacity <= 1) {
        safeStyle[key] = opacity;
      }
      return safeStyle;
    }

    if (["color", "backgroundColor", "borderColor"].includes(key)) {
      if (typeof value === "string" && COLOR_PATTERN.test(value.trim())) {
        safeStyle[key] = value.trim();
      }
      return safeStyle;
    }

    if (key === "display") {
      if (ALLOWED_DISPLAY_VALUES.includes(value)) {
        safeStyle[key] = value;
      }
      return safeStyle;
    }

    if (key === "textAlign") {
      if (ALLOWED_TEXT_ALIGN_VALUES.includes(value)) {
        safeStyle[key] = value;
      }
      return safeStyle;
    }

    if (typeof value === "string" && !/[<>{};]/.test(value)) {
      safeStyle[key] = value.trim();
      return safeStyle;
    }

    if (typeof value === "number" && CSS_SIZE_PATTERN.test(String(value))) {
      safeStyle[key] = value;
    }

    return safeStyle;
  }, {});
}

module.exports = {
  ALLOWED_STYLE_PROPERTIES,
  sanitizeStyleJson,
};
