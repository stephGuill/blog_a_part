const BUILDER_PAGE_TYPES = Object.freeze(["page", "post", "article", "landing"]);
const BUILDER_PAGE_STATUSES = Object.freeze(["draft", "published", "archived"]);
const BUILDER_SECTION_TYPES = Object.freeze([
  "hero",
  "content",
  "article",
  "grid",
  "columns",
  "gallery",
  "call_to_action",
  "custom",
]);
const BUILDER_BLOCK_TYPES = Object.freeze([
  "heading",
  "paragraph",
  "image",
  "avatar",
  "button",
  "link",
  "card",
  "divider",
  "quote",
  "list",
  "container",
  "spacer",
]);
const BUILDER_HEADING_LEVELS = Object.freeze(["h1", "h2", "h3", "h4", "h5", "h6"]);
const BUILDER_MEDIA_USAGE_TYPES = Object.freeze(["hero", "avatar", "content", "thumbnail", "other"]);

function isAllowed(value, allowedValues) {
  return allowedValues.includes(value);
}

module.exports = {
  BUILDER_BLOCK_TYPES,
  BUILDER_HEADING_LEVELS,
  BUILDER_MEDIA_USAGE_TYPES,
  BUILDER_PAGE_STATUSES,
  BUILDER_PAGE_TYPES,
  BUILDER_SECTION_TYPES,
  isAllowed,
};
