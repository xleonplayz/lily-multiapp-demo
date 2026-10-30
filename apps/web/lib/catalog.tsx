// What the shop shows about a product beyond its record: a short text and an
// illustration. Products added in the admin get a neutral look.

type Look = { text: string; tint: string; art: React.ReactNode };

const stroke = { fill: "none", stroke: "#1c1917", strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const coffee = (
  <svg viewBox="0 0 100 100" aria-hidden="true">
    <path {...stroke} d="M30 22h40l4 10H26z" />
    <path {...stroke} d="M28 32h44l-4 50a6 6 0 0 1-6 6H38a6 6 0 0 1-6-6z" />
    <path {...stroke} d="M40 52c4-6 16-6 20 0s-4 14-10 14-14-8-10-14z" />
    <path {...stroke} d="M50 47v24" />
  </svg>
);

const mug = (
  <svg viewBox="0 0 100 100" aria-hidden="true">
    <path {...stroke} d="M24 34h44v34a14 14 0 0 1-14 14H38a14 14 0 0 1-14-14z" />
    <path {...stroke} d="M68 42h6a10 10 0 0 1 0 20h-6" />
    <path {...stroke} d="M36 14c-4 5 4 9 0 14M48 12c-4 5 4 9 0 14M60 14c-4 5 4 9 0 14" />
  </svg>
);

const notebook = (
  <svg viewBox="0 0 100 100" aria-hidden="true">
    <rect {...stroke} x="26" y="16" width="50" height="68" rx="5" />
    <path {...stroke} d="M36 16v68M46 34h20M46 44h20M46 54h12" />
    <path {...stroke} d="M20 28h10M20 44h10M20 60h10" />
  </svg>
);

const tote = (
  <svg viewBox="0 0 100 100" aria-hidden="true">
    <path {...stroke} d="M22 38h56l-4 46H26z" />
    <path {...stroke} d="M36 38c0-22 28-22 28 0" />
    <path {...stroke} d="M40 62h20" />
  </svg>
);

const parcel = (
  <svg viewBox="0 0 100 100" aria-hidden="true">
    <path {...stroke} d="M18 32l32-14 32 14v38L50 84 18 70z" />
    <path {...stroke} d="M18 32l32 14 32-14M50 46v38" />
  </svg>
);

const looks: Record<string, Look> = {
  "Kaffee, 500 g": { text: "Hausröstung aus Brasilien und Äthiopien. Schokoladig, wenig Säure, für Filter und Siebträger.", tint: "linear-gradient(135deg,#fde7d3,#f6c9a2)", art: coffee },
  Teebecher: { text: "Handgedrehtes Steinzeug, 350 ml, spülmaschinenfest. Jeder Becher ein wenig anders.", tint: "linear-gradient(135deg,#e7efe9,#c9dccf)", art: mug },
  "Notizbuch A5": { text: "Fadengeheftet, 160 Seiten Punktraster, 100 g Papier, das keinen Füller durchlässt.", tint: "linear-gradient(135deg,#ece8f6,#d3cbeb)", art: notebook },
  Stoffbeutel: { text: "Schwere Bio-Baumwolle mit langen Henkeln. Trägt Einkauf, Laptop und Bücher.", tint: "linear-gradient(135deg,#f3eee4,#e3d6bd)", art: tote },
};

export const lookOf = (name: string): Look =>
  looks[name] ?? { text: "Neu im Sortiment.", tint: "linear-gradient(135deg,#f5f5f4,#e7e5e4)", art: parcel };
