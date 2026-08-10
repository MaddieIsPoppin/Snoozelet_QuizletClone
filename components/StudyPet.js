import SnoozeMascot from "@/components/SnoozeMascot";

export default function StudyPet({ totalXp = 0 }) {
  const stages = [
    { xp: 0, name: "Hatchling", next: 250 },
    { xp: 250, name: "Curious calf", next: 750 },
    { xp: 750, name: "Study buddy", next: 1500 },
    { xp: 1500, name: "Knowledge keeper", next: 3000 },
    { xp: 3000, name: "Aurora guardian", next: null },
  ];
  const stage = [...stages].reverse().find((item) => totalXp >= item.xp);
  const progress = stage.next ? Math.min(100, ((totalXp - stage.xp) / (stage.next - stage.xp)) * 100) : 100;
  return <section className="study-pet-habitat"><div className="pet-copy"><p className="eyebrow">Your study pet</p><h2>Snoo is a {stage.name}</h2><p>Every saved review gives Snoo experience. Keep studying to help your companion grow.</p><div className="pet-growth-track"><span style={{ width: `${progress}%` }} /></div><small>{stage.next ? `${stage.next - totalXp} XP until the next growth stage` : "Snoo has reached the final growth stage!"}</small></div><div className={`pet-stage pet-stage-${stages.indexOf(stage) + 1}`}><span>Stage {stages.indexOf(stage) + 1}</span><SnoozeMascot variant="hero" mood="happy" /></div></section>;
}
