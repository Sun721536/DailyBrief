import fs from "node:fs";

const AGRI_KW = ["农业","农机","补贴","粮食","种业","乡村振兴","农田","农村","农民","高标准农田","农业农村部"];
const FILTER_KW = ["娱乐","明星","体育","八卦","综艺"];

function run() {
  const dataDir = process.env.DAILY_REPORTS_DIR || "daily_reports";
  const tz = process.env.REPORT_TZ || "Asia/Shanghai";
  const now = new Date();
  const opts = { timeZone: tz };
  const y = now.toLocaleDateString("en-CA", { ...opts, year: "numeric" });
  const m = String(now.toLocaleDateString("en-CA", { ...opts, month: "2-digit" }));
  const d = String(now.toLocaleDateString("en-CA", { ...opts, day: "2-digit" }));
  // Actually use en-CA for YYYY-MM-DD
  const dateStr = now.toLocaleDateString("en-CA", { timeZone: tz }); // YYYY-MM-DD
  const [yy, mm, dd] = dateStr.split("-");
  const cnDate = `${yy}年${parseInt(mm)}月${parseInt(dd)}日`;

  const jsonPath = `${dataDir}/${dateStr}/${dateStr}.json`;
  if (!fs.existsSync(jsonPath)) {
    console.log("JSON not found:", jsonPath);
    process.exit(0);
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const allItems = [];
  (data.tech_briefs||[]).forEach(i => allItems.push({...i, _cat:"tech"}));
  (data.finance_briefs||[]).forEach(i => allItems.push({...i, _cat:"finance"}));
  (data.politics_briefs||[]).forEach(i => allItems.push({...i, _cat:"politics"}));

  const matchKW = (item, kws) => {
    const txt = (item.title + " " + (item.summary||"")).toLowerCase();
    return kws.some(k => txt.includes(k.toLowerCase()));
  };

  const clean = allItems.filter(i => !matchKW(i, FILTER_KW));

  let p1 = `【${cnDate}新闻联播精华 | 预计阅读时间：10分钟】\n\n`;

  const agri = clean.filter(i => matchKW(i, AGRI_KW));
  p1 += "## 🔴 农业农村专版（约3分钟）\n";
  if (agri.length) {
    agri.forEach(i => { p1 += `- **${i.title}** [${i.source}]\n  ${i.summary}\n`; });
  } else {
    p1 += "（今日无农业农村专题新闻）\n";
  }
  p1 += "\n";

  p1 += "## 🔴 中央重大政策与会议（约2分钟）\n";
  clean.filter(i => i._cat==="politics").slice(0,3).forEach(i => {
    p1 += `- **${i.title}** [${i.source}]\n  ${i.summary}\n`;
  });
  p1 += "\n## 🟡 国内经济与社会发展（约2分钟）\n";
  clean.filter(i => i._cat==="finance").slice(0,3).forEach(i => {
    p1 += `- ${i.title} [${i.source}]\n  ${i.summary}\n`;
  });
  p1 += "\n## 🟡 民生与社会热点（约1.5分钟）\n";
  clean.filter(i => i._cat==="politics").slice(0,2).forEach(i => {
    p1 += `- ${i.title}\n`;
  });
  p1 += "\n## ⚪ 国际新闻（约1分钟）\n";
  clean.filter(i => i._cat==="politics").slice(0,2).forEach(i => {
    p1 += `- ${i.title} [${i.source}]\n`;
  });
  p1 += "\n## ⚪ 国内联播快讯（约0.5分钟）\n";
  clean.filter(i => i._cat==="politics").slice(0,3).forEach(i => {
    p1 += `- ${i.title.slice(0,20)}\n`;
  });
  p1 += "\n---\n\n";

  // Part 2
  let p2 = `【今日信息简报 | 预计阅读时间：10分钟】\n\n`;
  if (data.hero_headline) p2 += `> ${data.hero_headline}\n\n`;

  p2 += "## 🔴 科技AI前沿（3分钟）\n";
  (data.tech_briefs||[]).slice(0,5).forEach(i => {
    p2 += `- **${i.title}** [${i.source}]\n  ${i.summary}\n`;
  });
  p2 += "\n## 🟡 财经资讯（2分钟）\n";
  (data.finance_briefs||[]).slice(0,5).forEach(i => {
    p2 += `- **${i.title}** [${i.source}]\n  ${i.summary}\n`;
  });
  p2 += "\n## 🌍 时政要闻（2分钟）\n";
  (data.politics_briefs||[]).slice(0,3).forEach(i => {
    p2 += `- **${i.title}** [${i.source}]\n  ${i.summary}\n`;
  });

  if (data.editor_note) p2 += `\n> ${data.editor_note}\n`;
  if (data.keywords) p2 += `\n**关键词：** ${data.keywords.join("、")}\n`;

  const full = p1 + p2;
  const cnChars = full.replace(/[^\u4e00-\u9fff]/g,"").length;
  const outPath = `${dataDir}/${dateStr}/${dateStr}_format.txt`;
  fs.writeFileSync(outPath, full, "utf8");
  console.log(`✅ 排版版已生成: ${outPath} (${cnChars}中文字)`);
}

run();