#!/usr/bin/env node
// Builds every SVG used by the profile README. No dependencies, Node 20+.
//
//   node scripts/generate.mjs            live data (needs GITHUB_TOKEN) -> dist/
//   node scripts/generate.mjs --mock     sample data, for local preview -> dist/
//   node scripts/generate.mjs --static   header banner only -> assets/ (committed)
//
// Each card is written twice: <name>-dark.svg and <name>-light.svg.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOGIN = process.env.GITHUB_REPOSITORY_OWNER || "DamienReichhart";
const args = new Set(process.argv.slice(2));

// ── Edit me ──────────────────────────────────────────────────────────────────
const PROFILE = {
  name: "Damien Reichhart",
  location: "Strasbourg, France",
  roles: ["Software Engineer", "Full Stack · DevOps · AI", "Ships from UI to infrastructure"],
  constellation: ["TypeScript", "Rust", "Python", "Docker", "Kubernetes", "PostgreSQL", "LLMs"],
};

// Featured repositories. Stars, language and last push come from the API.
const PROJECTS = [
  {
    repo: "BackTrade",
    tag: "live demo",
    text: "Replay historical markets as if they were live: trade in simulated real time, then dissect your performance.",
  },
  {
    repo: "Homeport",
    tag: "desktop app",
    text: "Every Docker Engine on one board. Agentless desktop app for Docker, Podman, Swarm and Kubernetes hosts.",
  },
  {
    repo: "MarketForge",
    tag: "pip install marketforge",
    text: "Synthetic OHLCV data for forex, crypto and stocks, realistic enough to backtest and stress-test strategies.",
  },
  {
    repo: "DeliverTable",
    tag: "team of 3 · lead dev",
    text: "Restaurant booking and delivery platform: interactive map, online orders and payments.",
  },
];
// ─────────────────────────────────────────────────────────────────────────────

const THEMES = {
  dark: {
    bg: "#0d1117", border: "#30363d", text: "#e6edf3", muted: "#8b949e", faint: "#21262d",
    accent: "#58a6ff", up: "#3fb950", down: "#f85149", violet: "#bc8cff", amber: "#d29922",
  },
  light: {
    bg: "#ffffff", border: "#d0d7de", text: "#1f2328", muted: "#656d76", faint: "#eaeef2",
    accent: "#0969da", up: "#1a7f37", down: "#cf222e", violet: "#8250df", amber: "#9a6700",
  },
};

const MONO = "ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace";
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const r1 = (n) => Math.round(n * 10) / 10;

function svg(w, h, t, body, { frame = true, label = "" } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(label)}">
<style>
text{font-family:${SANS};fill:${t.text}}
.m{font-family:${MONO}}
.mu{fill:${t.muted}}
.ac{fill:${t.accent}}
@keyframes in{from{opacity:0}to{opacity:1}}
@keyframes blink{50%{opacity:0}}
@keyframes pulse{0%,100%{opacity:.35}50%{opacity:1}}
@keyframes flow{to{stroke-dashoffset:-24}}
.in{opacity:0;animation:in .5s ease-out forwards}
@media (prefers-reduced-motion:reduce){*{animation:none!important}.in{opacity:1}}
</style>
${frame ? `<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="10" fill="${t.bg}" stroke="${t.border}"/>` : ""}
${body}
</svg>
`;
}

function wrap(text, max) {
  const lines = [""];
  for (const word of text.split(" ")) {
    const cur = lines[lines.length - 1];
    if (cur && (cur + " " + word).length > max) lines.push(word);
    else lines[lines.length - 1] = cur ? cur + " " + word : word;
  }
  return lines;
}

// ── Header banner ────────────────────────────────────────────────────────────
function header(t) {
  const W = 840, H = 230;
  // Typed roles: each one wipes in, holds, wipes out, in turn.
  const cw = 10.9, n = PROFILE.roles.length, slot = 1 / n;
  const roles = PROFILE.roles.map((role, i) => {
    const full = r1(role.length * cw);
    const a = i * slot, k = [0, a, a + slot * 0.25, a + slot * 0.85, a + slot, 1].map((v) => r1(v * 1000) / 1000);
    const vals = (on, off) => [off, off, on, on, off, off].join(";");
    const anim = (attr, on, off) =>
      `<animate attributeName="${attr}" dur="${n * 4}s" repeatCount="indefinite" keyTimes="${k.join(";")}" values="${vals(on, off)}"/>`;
    return `<clipPath id="r${i}"><rect x="40" y="118" height="30" width="0">${anim("width", full, 0)}</rect></clipPath>
<text x="40" y="140" class="m ac" font-size="18" textLength="${full}" lengthAdjust="spacingAndGlyphs" clip-path="url(#r${i})">${esc(role)}</text>
<rect y="122" width="9" height="22" fill="${t.accent}" opacity="0" style="animation:blink 1s steps(1) infinite"><animate attributeName="x" dur="${n * 4}s" repeatCount="indefinite" keyTimes="${k.join(";")}" values="${vals(44 + full, 42)}"/><animate attributeName="opacity" dur="${n * 4}s" repeatCount="indefinite" calcMode="discrete" keyTimes="0;${k[1]};${k[4]};1" values="0;1;0;0"/></rect>`;
  });

  // Constellation of the stack, echoing the skills view on the portfolio.
  const pts = [[560, 62], [668, 40], [770, 78], [612, 128], [726, 142], [560, 186], [790, 188]];
  const links = [[0, 1], [1, 2], [0, 3], [1, 3], [3, 4], [2, 4], [3, 5], [4, 6], [1, 4]];
  const colors = [t.accent, t.amber, t.up, t.accent, t.violet, t.up, t.violet];
  const lines = links
    .map(([a, b], i) =>
      `<line x1="${pts[a][0]}" y1="${pts[a][1]}" x2="${pts[b][0]}" y2="${pts[b][1]}" stroke="${t.border}" stroke-width="1.2" stroke-dasharray="4 8" style="animation:flow ${3 + (i % 3)}s linear infinite"/>`)
    .join("\n");
  const nodes = PROFILE.constellation
    .slice(0, pts.length)
    .map((name, i) => {
      const [x, y] = pts[i];
      return `<circle cx="${x}" cy="${y}" r="11" fill="${colors[i]}" opacity=".14" style="animation:pulse ${3 + (i % 4) * 0.7}s ease-in-out ${i * 0.4}s infinite"/>
<circle cx="${x}" cy="${y}" r="4" fill="${colors[i]}"/>
<text x="${x}" y="${y + 24}" text-anchor="middle" class="m mu" font-size="11">${esc(name)}</text>`;
    })
    .join("\n");
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const dust = Array.from({ length: 28 }, (_, i) =>
    `<circle cx="${r1(20 + rnd() * 800)}" cy="${r1(14 + rnd() * 200)}" r="${r1(0.6 + rnd())}" fill="${t.muted}" style="animation:pulse ${r1(2 + rnd() * 4)}s ease-in-out ${r1(rnd() * 4)}s infinite"/>`)
    .join("");

  return svg(W, H, t, `${dust}
${lines}
${nodes}
<text x="40" y="52" class="m mu" font-size="13"><tspan fill="${t.up}">~</tspan> $ whoami</text>
<text x="40" y="100" font-size="40" font-weight="700" letter-spacing="-.5">${esc(PROFILE.name)}</text>
${roles.join("\n")}
<text x="40" y="186" class="mu" font-size="13.5">${esc(PROFILE.location)}  ·  work-study engineer and master's student</text>
<text x="40" y="206" class="mu" font-size="13.5">Building trading tools and container tooling in the open</text>`,
    { label: `${PROFILE.name}, ${PROFILE.roles.join(", ")}` });
}

// ── Commit market: contributions drawn as weekly candles ─────────────────────
function marketStats(weeks) {
  const days = weeks.flat();
  let p = 0, best = { count: 0, date: "" };
  const candles = weeks.map((week) => {
    const open = p;
    let high = p, low = p, vol = 0;
    for (const d of week) {
      p = p * 0.9 + d.count; // momentum: decays without commits, pumps with them
      high = Math.max(high, p);
      low = Math.min(low, p);
      vol += d.count;
      if (d.count > best.count) best = d;
    }
    return { open, close: p, high, low, vol, date: week[0].date };
  });
  // A streak survives an empty "today": the day is not over yet.
  let streak = 0, longest = 0, run = 0;
  for (const d of days) longest = Math.max(longest, (run = d.count ? run + 1 : 0));
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count) streak++;
    else if (i !== days.length - 1) break;
  }
  return { candles, best, streak, longest, total: days.reduce((s, d) => s + d.count, 0) };
}

function market(t, weeks) {
  const W = 840, H = 330, X0 = 24, X1 = 792, Y0 = 92, Y1 = 232, V0 = 246, V1 = 290;
  const { candles, best, streak, longest, total } = marketStats(weeks);
  // Log scale, like any chart with a 100x move: one huge day must not flatten the year.
  const topP = Math.max(1, ...candles.map((c) => c.high));
  const maxP = Math.log1p(topP) * 1.06;
  const maxV = Math.log1p(Math.max(1, ...candles.map((c) => c.vol)));
  const step = (X1 - X0) / candles.length, bw = Math.max(3, step * 0.62);
  const y = (v) => r1(Y1 - (Math.log1p(v) / maxP) * (Y1 - Y0));

  const grid = [1, 3, 10, 30, 100, 300, 1000, 3000]
    .filter((v) => v <= topP)
    .slice(-4)
    .map((v) => `<line x1="${X0}" x2="${X1}" y1="${y(v)}" y2="${y(v)}" stroke="${t.faint}"/>
<text x="${X1 + 8}" y="${y(v) + 4}" class="m mu" font-size="10">${v}</text>`)
    .join("\n");

  let lastMonth = -1;
  const bars = candles
    .map((c, i) => {
      const cx = r1(X0 + step * (i + 0.5)), up = c.close >= c.open, col = up ? t.up : t.down;
      const top = y(Math.max(c.open, c.close)), bot = y(Math.min(c.open, c.close));
      const vh = r1((Math.log1p(c.vol) / maxV) * (V1 - V0));
      const month = Number(c.date.slice(5, 7)) - 1;
      let tick = "";
      if (month !== lastMonth && i < candles.length - 2) {
        if (lastMonth !== -1 || i === 0) tick = `<text x="${cx}" y="${H - 16}" class="m mu" font-size="10" text-anchor="middle">${MONTHS[month]}</text>`;
        lastMonth = month;
      }
      return `<g class="in" style="animation-delay:${r1(i * 0.025)}s"><line x1="${cx}" x2="${cx}" y1="${y(c.high)}" y2="${y(c.low)}" stroke="${col}" stroke-width="1.2"/><rect x="${r1(cx - bw / 2)}" y="${top}" width="${r1(bw)}" height="${Math.max(1.5, r1(bot - top))}" rx="1" fill="${col}"/><rect x="${r1(cx - bw / 2)}" y="${r1(V1 - vh)}" width="${r1(bw)}" height="${vh}" fill="${col}" opacity=".35"/></g>${tick}`;
    })
    .join("\n");

  const last = candles[candles.length - 1];
  const chg = last.open > 0.05 ? ((last.close - last.open) / last.open) * 100 : null;
  const chgCol = chg === null ? t.muted : chg >= 0 ? t.up : t.down;
  const chgTxt = chg === null ? "flat" : `${chg >= 0 ? "▲ +" : "▼ "}${chg.toFixed(1)}%`;
  const stat = (x, k, v) =>
    `<text x="${x}" y="36" class="m mu" font-size="10" text-anchor="end">${k}</text><text x="${x}" y="57" class="m" font-size="16" font-weight="600" text-anchor="end">${esc(v)}</text>`;
  const ly = y(last.close);

  return svg(W, H, t, `<text x="${X0}" y="42" class="m" font-size="17" font-weight="700"><tspan class="ac">${esc(initials())}/COMMITS</tspan><tspan dx="14">${last.close.toFixed(1)}</tspan><tspan dx="10" font-size="13" fill="${chgCol}">${chgTxt}</tspan></text>
<text x="${X0}" y="62" class="mu" font-size="11.5">Commit momentum index · weekly candles · log scale</text>
${stat(816, "52W VOLUME", total.toLocaleString("en-US"))}
${stat(700, "BEST DAY", best.count)}
${stat(612, "STREAK", `${streak}d`)}
${stat(530, "RECORD", `${longest}d`)}
${grid}
${bars}
<line x1="${X0}" x2="${X1}" y1="${ly}" y2="${ly}" stroke="${chgCol}" stroke-dasharray="2 4" opacity=".7"/>
<circle cx="${r1(X0 + step * (candles.length - 0.5))}" cy="${ly}" r="3" fill="${chgCol}" style="animation:pulse 1.6s ease-in-out infinite"/>`,
    { label: `Contribution chart drawn as market candles: ${total} contributions in the last year, current streak ${streak} days` });
}

const initials = () => PROFILE.name.split(/\s+/).map((w) => w[0]).join("").toUpperCase();

// ── Languages ────────────────────────────────────────────────────────────────
function languages(t, repos) {
  const W = 410, H = 190, bytes = new Map();
  for (const r of repos) for (const l of r.languages) {
    const e = bytes.get(l.name) || { name: l.name, color: l.color || t.muted, size: 0 };
    e.size += l.size;
    bytes.set(l.name, e);
  }
  const all = [...bytes.values()].sort((a, b) => b.size - a.size);
  const sum = all.reduce((s, l) => s + l.size, 0) || 1;
  const top = all.slice(0, 6);
  const rest = all.slice(6).reduce((s, l) => s + l.size, 0);
  if (rest) top.push({ name: "Other", color: t.muted, size: rest });

  let x = 20;
  const BW = W - 40;
  const segs = top
    .map((l) => {
      const w = (l.size / sum) * BW, out = `<rect x="${r1(x)}" y="58" width="${r1(w)}" height="10" fill="${l.color}"/>`;
      x += w;
      return out;
    })
    .join("");
  const legend = top
    .map((l, i) => {
      const lx = 20 + (i % 2) * 190, ly = 98 + Math.floor(i / 2) * 22;
      return `<g class="in" style="animation-delay:${i * 0.08}s"><circle cx="${lx + 5}" cy="${ly - 4}" r="5" fill="${l.color}"/><text x="${lx + 18}" y="${ly}" font-size="12.5">${esc(l.name)}</text><text x="${lx + 170}" y="${ly}" class="m mu" font-size="11.5" text-anchor="end">${((l.size / sum) * 100).toFixed(1)}%</text></g>`;
    })
    .join("\n");
  return svg(W, H, t, `<text x="20" y="34" font-size="14" font-weight="600">Languages</text>
<text x="${W - 20}" y="34" class="mu" font-size="11" text-anchor="end">bytes across ${repos.length} public repos</text>
<clipPath id="bar"><rect x="20" y="58" width="${BW}" height="10" rx="5"/></clipPath>
<g clip-path="url(#bar)">${segs}</g>
${legend}`, { label: "Languages: " + top.map((l) => `${l.name} ${((l.size / sum) * 100).toFixed(0)}%`).join(", ") });
}

// ── Recent activity, as a terminal ───────────────────────────────────────────
function activity(t, repos) {
  const W = 410, H = 190;
  const rows = [...repos]
    .filter((r) => r.name.toLowerCase() !== LOGIN.toLowerCase())
    .sort((a, b) => b.pushedAt.localeCompare(a.pushedAt))
    .slice(0, 5)
    .map((r, i) => {
      const y = 86 + i * 19, name = r.name.length > 30 ? r.name.slice(0, 29) + "…" : r.name;
      return `<g class="in" style="animation-delay:${0.3 + i * 0.15}s"><text x="20" y="${y}" class="m mu" font-size="11.5">${r.pushedAt.slice(5, 10)}</text><text x="68" y="${y}" class="m" font-size="11.5">${esc(name)}</text><text x="${W - 20}" y="${y}" class="m" font-size="11.5" text-anchor="end" fill="${r.language?.color || t.muted}">${esc(r.language?.name || "")}</text></g>`;
    })
    .join("\n");
  return svg(W, H, t, `<circle cx="24" cy="24" r="5" fill="${t.down}"/><circle cx="42" cy="24" r="5" fill="${t.amber}"/><circle cx="60" cy="24" r="5" fill="${t.up}"/>
<text x="${W - 20}" y="28" class="m mu" font-size="11" text-anchor="end">recent pushes</text>
<line x1="0" x2="${W}" y1="42" y2="42" stroke="${t.border}"/>
<text x="20" y="64" class="m" font-size="11.5"><tspan fill="${t.up}">~</tspan><tspan class="mu"> $ </tspan>ls -t ~/code | head -5</text>
${rows}
<rect x="20" y="${86 + 5 * 19 - 12}" width="7" height="13" fill="${t.accent}" style="animation:blink 1s steps(1) infinite"/>`,
    { label: "Most recently pushed repositories" });
}

// ── Project card ─────────────────────────────────────────────────────────────
function project(t, p, repo) {
  const W = 410, H = 128;
  const lines = wrap(p.text, 58).slice(0, 2);
  const lang = repo?.language;
  const tagW = r1(p.tag.length * 6.4 + 16);
  return svg(W, H, t, `<text x="20" y="35" class="ac" font-size="16" font-weight="700">${esc(p.repo)}</text>
<rect x="${W - 20 - tagW}" y="19" width="${tagW}" height="22" rx="11" fill="none" stroke="${t.border}"/>
<text x="${W - 20 - tagW / 2}" y="34" class="m mu" font-size="10.5" text-anchor="middle">${esc(p.tag)}</text>
${lines.map((l, i) => `<text x="20" y="${61 + i * 18}" class="mu" font-size="12.5">${esc(l)}</text>`).join("\n")}
<circle cx="25" cy="104" r="5" fill="${lang?.color || t.muted}"/>
<text x="38" y="108" font-size="12">${esc(lang?.name || "n/a")}</text>
<text x="${W - 20}" y="108" class="m mu" font-size="11.5" text-anchor="end">★ ${repo?.stars ?? 0}  ·  pushed ${repo ? repo.pushedAt.slice(0, 7) : "n/a"}</text>`,
    { label: `${p.repo}: ${p.text}` });
}

// ── Data ─────────────────────────────────────────────────────────────────────
async function fetchLive() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set (use --mock for a local preview)");
  const query = `query($login:String!){user(login:$login){
    contributionsCollection{contributionCalendar{weeks{contributionDays{date contributionCount}}}}
    repositories(first:100,ownerAffiliations:OWNER,isFork:false,privacy:PUBLIC,orderBy:{field:PUSHED_AT,direction:DESC}){
      nodes{name stargazerCount pushedAt primaryLanguage{name color}
        languages(first:10,orderBy:{field:SIZE,direction:DESC}){edges{size node{name color}}}}}}}`;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { authorization: `bearer ${token}`, "content-type": "application/json", "user-agent": "profile-readme" },
    body: JSON.stringify({ query, variables: { login: LOGIN } }),
  });
  const json = await res.json();
  if (!res.ok || json.errors || !json.data?.user) {
    throw new Error(`GitHub API failed (${res.status}): ${JSON.stringify(json.errors || json).slice(0, 400)}`);
  }
  const u = json.data.user;
  return {
    weeks: u.contributionsCollection.contributionCalendar.weeks.map((w) =>
      w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount }))),
    repos: u.repositories.nodes.map((r) => ({
      name: r.name,
      stars: r.stargazerCount,
      pushedAt: r.pushedAt || "",
      language: r.primaryLanguage,
      languages: r.languages.edges.map((e) => ({ name: e.node.name, color: e.node.color, size: e.size })),
    })),
  };
}

function mockData() {
  let seed = 42;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const weeks = [], start = new Date(Date.UTC(2025, 10, 9));
  for (let w = 0; w < 53; w++) {
    const mood = 0.5 + Math.sin(w / 5) * 0.5 + rnd() * 0.6;
    weeks.push(Array.from({ length: 7 }, (_, d) => {
      const date = new Date(start.getTime() + (w * 7 + d) * 864e5).toISOString().slice(0, 10);
      return { date, count: rnd() < 0.3 ? 0 : Math.floor(rnd() * rnd() * 16 * mood) };
    }));
  }
  const C = { TypeScript: "#3178c6", Rust: "#dea584", Python: "#3572A5", "C#": "#178600", Java: "#b07219", PHP: "#4F5D95", Shell: "#89e051", HTML: "#e34c26" };
  const list = [
    ["Homeport", "Rust", 2, "2026-11-09"], ["template-fullstack-typescript-production", "TypeScript", 2, "2026-11-09"],
    ["BackTrade", "TypeScript", 4, "2026-09-21"], ["DeliverTable", "C#", 2, "2026-09-11"], ["NextCloud-Docker", "Shell", 0, "2026-08-28"],
    ["Odoo-Docker", "Shell", 0, "2026-08-24"], ["ERPNext-Docker", "Shell", 0, "2026-08-13"], ["MarketForge", "Python", 2, "2026-06-14"],
    ["DockerWebInterface", "PHP", 1, "2026-01-27"], ["ChatApp", "Java", 1, "2025-10-17"],
  ];
  const repos = list.map(([name, lang, stars, pushed]) => ({
    name, stars, pushedAt: pushed + "T00:00:00Z", language: { name: lang, color: C[lang] },
    languages: [{ name: lang, color: C[lang], size: 40000 + Math.floor(rnd() * 400000) }, { name: "HTML", color: C.HTML, size: Math.floor(rnd() * 30000) }],
  }));
  return { weeks, repos };
}

// ── Main ─────────────────────────────────────────────────────────────────────
function emit(dir, name, render) {
  mkdirSync(dir, { recursive: true });
  for (const [theme, t] of Object.entries(THEMES)) writeFileSync(join(dir, `${name}-${theme}.svg`), render(t));
}

if (args.has("--static")) {
  emit(join(ROOT, "assets"), "header", header);
  console.log("wrote assets/header-{dark,light}.svg");
} else {
  const data = args.has("--mock") ? mockData() : await fetchLive();
  const dist = join(ROOT, "dist");
  emit(dist, "market", (t) => market(t, data.weeks));
  emit(dist, "languages", (t) => languages(t, data.repos));
  emit(dist, "activity", (t) => activity(t, data.repos));
  for (const p of PROJECTS) {
    const repo = data.repos.find((r) => r.name.toLowerCase() === p.repo.toLowerCase());
    if (!repo) console.warn(`warning: featured repo "${p.repo}" not found among public repos`);
    emit(dist, `project-${p.repo.toLowerCase()}`, (t) => project(t, p, repo));
  }
  console.log(`wrote ${3 + PROJECTS.length} cards x 2 themes to dist/ (${data.repos.length} repos, ${data.weeks.length} weeks)`);
}
