// Every category (rayon) gets its own color + icon, automatically.
const ICONS = [
  [/ألبان|حليب|لبن|جبن|lait|fromage|yaourt|dairy/i, "🥛"],
  [/مشروب|عصير|ماء|boisson|jus|eau|drink|soda/i, "🥤"],
  [/خضر|légume|legume|vegetable/i, "🥬"],
  [/فواكه|غلال|fruit/i, "🍎"],
  [/لحم|لحوم|دجاج|دواجن|سمك|أسماك|viande|poulet|poisson|meat/i, "🥩"],
  [/خبز|مخبوز|pain|boulang|bread|pâtisserie|patisserie/i, "🥖"],
  [/تنظيف|منظف|nettoy|clean|lessive/i, "🧼"],
  [/حلويات|شوكولا|بسكوي|bonbon|chocolat|biscuit|snack|sweet/i, "🍫"],
  [/معلبات|تونة|conserve|thon|canned/i, "🥫"],
  [/قهوة|شاي|café|cafe|thé|tea|coffee/i, "☕"],
  [
    /زيت|توابل|سكر|دقيق|أرز|معجنات|huile|épice|epice|sucre|farine|riz|pâtes|pates|pasta|oil/i,
    "🍝",
  ],
  [/عناية|صحة|hygi|soin|care|shampo/i, "🧴"],
];

// Ready-made shelves (rayons) offered in the product form's dropdown.
export const DEFAULT_CATEGORIES = [
  "ألبان ومشتقاتها",
  "مشروبات وعصائر",
  "خضر",
  "غلال (فواكه)",
  "خبز ومخبوزات",
  "معلبات",
  "حبوب وزيوت وتوابل",
  "حلويات وبسكويت",
  "قهوة وشاي",
  "منظفات",
  "عناية شخصية",
  "أخرى",
];

export function categoryStyle(name = "") {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const hue = (h * 47) % 360;
  const emoji = ICONS.find(([re]) => re.test(name))?.[1] ?? "🛒";
  return {
    emoji,
    color: `hsl(${hue} 55% 45%)`,
    soft: `hsl(${hue} 60% 50% / 0.14)`,
  };
}
