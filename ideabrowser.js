/* Turns a pasted IdeaBrowser email or link into a fully written-up bar.
   Pure text parsing — no network, no dependencies. Returns null when the text
   isn't from IdeaBrowser, so quick capture falls back to a plain thought. */

const IDEA_URL_PATTERN = /https?:\/\/(?:www\.)?ideabrowser\.com\/(?:idea|hub\/ideas)\/[^\s)\]]+/i;

const IDEA_BLOCK_END_PATTERNS = [
  /^\[?(Browse this idea|Featured image|View full idea)/i,
  /^Today's report is free/i,
  /^Also released today:/i,
  /^Today's Sponsor/i,
  /^HIDDEN NICHE OPPORTUNITY/i,
  /^Founder Playbook/i,
  /^BUILDER BOOKMARKS/i,
  /^Sneak peek/i,
  /^PS\b/i
];

const TITLE_SMALL_WORDS = new Set(["and", "or", "for", "the", "a", "an", "to", "of", "in", "on", "with"]);

/* Slugs lowercase everything, so title casing alone turns "ai" into "Ai". */
const TITLE_ACRONYMS = new Map(
  ["AI", "API", "AR", "VR", "B2B", "B2C", "CRM", "LLM", "SaaS", "SEO", "UI", "UX"].map((word) => [
    word.toLowerCase(),
    word
  ])
);

function cleanText(value) {
  return String(value || "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalIdeaBrowserUrl(value) {
  const match = String(value || "").match(IDEA_URL_PATTERN);
  if (!match) return "";
  try {
    const url = new URL(match[0]);
    return `${url.origin}${url.pathname}`;
  } catch {
    return match[0];
  }
}

function titleCaseSlug(slug) {
  return slug
    .replace(/-[a-f0-9]{8,}$/i, "")
    .split("-")
    .filter(Boolean)
    .map((word, index) => {
      if (/^\d+$/.test(word)) return word;
      const lower = word.toLowerCase();
      if (TITLE_ACRONYMS.has(lower)) return TITLE_ACRONYMS.get(lower);
      if (index > 0 && TITLE_SMALL_WORDS.has(lower)) return lower;
      return `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
    })
    .join(" ");
}

function titleFromIdeaUrl(sourceUrl) {
  if (!sourceUrl) return "";
  try {
    const pathname = new URL(sourceUrl).pathname;
    const slug = pathname.split("/idea/")[1] || pathname.split("/hub/ideas/")[1] || "";
    return titleCaseSlug(slug);
  } catch {
    return "";
  }
}

function titleFromSubject(text) {
  const match = String(text || "").match(/^\s*(?:Subject:\s*)?Idea of the Day:\s*([^\n]+)/im);
  return cleanText(match ? match[1] : "");
}

function extractIdeaBlock(text) {
  const lines = String(text || "").split(/\r?\n/);
  const markerIndex = lines.findIndex((line) => /^Idea of the Day\s*$/i.test(line.trim()));
  const block = [];

  for (const line of lines.slice(markerIndex >= 0 ? markerIndex + 1 : 0)) {
    const trimmed = line.trim();
    if (trimmed && IDEA_BLOCK_END_PATTERNS.some((pattern) => pattern.test(trimmed))) break;
    block.push(line);
  }

  return block.join("\n").trim();
}

function paragraphsFromBlock(block) {
  return String(block || "")
    .split(/\n\s*\n/)
    .map((paragraph) => cleanText(paragraph.replace(/\n/g, " ")))
    .filter((paragraph) => paragraph && !/^https?:\/\//i.test(paragraph));
}

function splitSentences(value) {
  return cleanText(value)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function parseIdeaBrowserBar(rawText) {
  const text = String(rawText || "").trim();
  const looksLikeIdeaBrowser =
    /Idea of the Day/i.test(text) || /ideabrowser\.com\/(?:idea|hub\/ideas)\//i.test(text);
  if (!text || !looksLikeIdeaBrowser) return null;

  const sourceUrl = canonicalIdeaBrowserUrl(text);
  const paragraphs = paragraphsFromBlock(extractIdeaBlock(text));
  const title = titleFromSubject(text) || titleFromIdeaUrl(sourceUrl) || "IdeaBrowser idea";

  const thesis =
    paragraphs.find((paragraph) =>
      /\bis\b.+\b(platform|tool|product|dashboard|marketplace)\b/i.test(paragraph)
    ) ||
    paragraphs[1] ||
    paragraphs[0] ||
    `${title} is an IdeaBrowser concept saved for follow-up and validation.`;

  const support = paragraphs.find((paragraph) => paragraph !== thesis) || "";
  const supportingNotes = splitSentences(support).slice(0, 4);
  const notes = [
    "Core thesis:",
    thesis,
    "",
    "Supporting notes:",
    ...(supportingNotes.length
      ? supportingNotes
      : [
          `Use the source page to expand ${title} into customer, pain, workflow, and proof.`,
          "Start by finding the manual workaround people already use."
        ]
    ).map((note) => `- ${note}`),
    "",
    "Follow-up angles:",
    "- Validate the sharpest user pain and the first data source.",
    ...(sourceUrl ? ["", `Source: ${sourceUrl}`] : [])
  ].join("\n");

  return {
    kind: "Idea",
    title,
    notes,
    category: "IdeaBrowser",
    status: "New",
    impact: "3",
    effort: "3",
    next: "Validate the sharpest user pain and the first data source.",
    tags: ["ideabrowser"]
  };
}
