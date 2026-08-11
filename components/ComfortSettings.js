"use client";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

const DEFAULTS = { theme: "night", fontSize: "normal", dyslexicFont: false, highContrast: false, reducedMotion: false, sounds: true, celebrations: true };
function applyPreferences(value) {
  const root = document.documentElement;
  for (const [key, setting] of Object.entries(value)) root.dataset[key] = String(setting);
}

export default function ComfortSettings({ placement = "topbar" }) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [preferences, setPreferences] = useState(DEFAULTS);
  useEffect(() => {
    setMounted(true);
    try { const saved = JSON.parse(localStorage.getItem("snoozelet-comfort") || "{}"); const next = { ...DEFAULTS, ...saved, theme: saved.theme === "oled" ? "night" : (saved.theme || "night") }; setPreferences(next); applyPreferences(next); localStorage.setItem("snoozelet-comfort", JSON.stringify(next)); }
    catch { applyPreferences(DEFAULTS); }
  }, []);
  function update(key, value) {
    const next = { ...preferences, [key]: value };
    setPreferences(next); applyPreferences(next); localStorage.setItem("snoozelet-comfort", JSON.stringify(next));
  }
  const panel = <><button className="comfort-backdrop" type="button" aria-label="Close comfort settings" onClick={() => setOpen(false)} /><section className={`comfort-panel comfort-panel-${placement}`} id={panelId} aria-label="Accessibility and comfort settings">
      <div className="comfort-heading"><div><strong>Comfort settings</strong><small>Saved on this device</small></div><button type="button" onClick={() => setOpen(false)} aria-label="Close comfort settings">×</button></div>
      <label>Theme<select value={preferences.theme} onChange={(event) => update("theme", event.target.value)}><option value="night">Night</option><option value="light">Light</option></select></label>
      <label>Text size<select value={preferences.fontSize} onChange={(event) => update("fontSize", event.target.value)}><option value="normal">Normal</option><option value="large">Comfortable</option><option value="xlarge">Extra comfortable</option></select></label>
      {[["dyslexicFont", "Readable font"], ["highContrast", "High contrast"], ["reducedMotion", "Reduce motion"], ["sounds", "Sound effects"], ["celebrations", "Celebrations"]].map(([key, label]) => <label className="comfort-switch" key={key}><span>{label}</span><input type="checkbox" checked={preferences[key]} onChange={(event) => update(key, event.target.checked)} /></label>)}
      <button className="button" type="button" onClick={() => { setPreferences(DEFAULTS); applyPreferences(DEFAULTS); localStorage.removeItem("snoozelet-comfort"); }}>Reset settings</button>
    </section></>;
  return <div className="comfort-settings">
    <button className="comfort-trigger" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls={panelId}>Comfort</button>
    {open && mounted ? createPortal(panel, document.body) : null}
  </div>;
}
