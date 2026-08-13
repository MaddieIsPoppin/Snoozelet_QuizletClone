function parseCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function splitOnLastSpacedDash(line) {
  const matches = [...line.matchAll(/\s[-–—]\s/g)];
  const delimiter = matches.at(-1);

  if (!delimiter) return [];

  const delimiterStart = delimiter.index;
  const delimiterEnd = delimiterStart + delimiter[0].length;
  return [line.slice(0, delimiterStart).trim(), line.slice(delimiterEnd).trim()];
}

export function parseCards(input, format = "auto") {
  if (format === "auto" || format === "smart") {
    const smart = parseSmartPaste(input);
    if (smart.cards.length && smart.recognizedBlocks) return smart.cards;
  }
  const lines = String(input || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const cards = [];

  for (const [index, line] of lines.entries()) {
    let parts = [];

    if (format === "csv") {
      parts = parseCsvLine(line);
    }

    if (parts.length < 2 && line.includes("\t")) {
      parts = line.split("\t");
    }

    if (parts.length < 2) {
      parts = splitOnLastSpacedDash(line);
    }

    if (parts.length < 2 && line.includes(": ")) {
      const separatorIndex = line.indexOf(": ");
      parts = [line.slice(0, separatorIndex), line.slice(separatorIndex + 2)];
    }

    if (parts.length < 2 && format === "auto" && line.includes(",")) {
      parts = parseCsvLine(line);
    }

    if (parts.length >= 2) {
      const [term, ...definitionParts] = parts;
      const definition = definitionParts.join(format === "csv" ? ", " : " ").trim();
      const looksLikeHeader = index === 0 && /^term$/i.test(term.trim()) && /^definition$/i.test(definition);
      if (looksLikeHeader) continue;
      if (term.trim() && definition) {
        cards.push({ term: term.trim(), definition });
      }
    }
  }

  return cards;
}

export function parseSmartPaste(input) {
  const lines = String(input || "").split(/\r?\n/);
  const metadata = { subject: "", folder: "", set: "" };
  const cards = [];
  const invalid = [];
  let question = "";
  let answer = "";
  let recognizedBlocks = false;

  function commit() {
    if (question.trim() && answer.trim()) cards.push({ term: question.trim(), definition: answer.trim() });
    else if (question.trim() || answer.trim()) invalid.push({ term: question.trim(), definition: answer.trim(), reason: "Missing front or back" });
    question = ""; answer = "";
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || /^#\s*Snoozelet/i.test(line)) { if (!line && question && answer) commit(); continue; }
    const meta = line.match(/^(Subject|Module|Folder|Study Unit|Set|Deck):\s*(.+)$/i);
    if (meta) { const key = /subject|module/i.test(meta[1]) ? "subject" : /set|deck/i.test(meta[1]) ? "set" : "folder"; metadata[key] = meta[2].trim(); recognizedBlocks = true; continue; }
    const q = line.match(/^(?:Q|Question):\s*(.*)$/i);
    if (q) { if (question || answer) commit(); question = q[1]; recognizedBlocks = true; continue; }
    const a = line.match(/^(?:A|Answer):\s*(.*)$/i);
    if (a) { answer = a[1]; recognizedBlocks = true; continue; }
    if (answer) answer += `\n${line}`;
    else if (question) question += ` ${line}`;
  }
  if (question || answer) commit();
  if (!recognizedBlocks) {
    const fallback = String(input || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    for (const line of fallback) {
      let parts = line.includes("\t") ? line.split("\t") : splitOnLastSpacedDash(line);
      if (parts.length < 2 && line.includes(",")) parts = parseCsvLine(line);
      if (parts.length >= 2) cards.push({ term: parts[0].trim(), definition: parts.slice(1).join(", ").trim() });
      else invalid.push({ term: line, definition: "", reason: "Unrecognised line" });
    }
  }
  return { cards: cards.filter((card) => card.term && card.definition), invalid, metadata, recognizedBlocks };
}
