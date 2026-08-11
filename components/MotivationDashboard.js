"use client";
import { useEffect, useMemo, useState } from "react";

export default function MotivationDashboard({ summary, totalXp, level, bestStreak }) {
  const [dailyGoal, setDailyGoal] = useState(20);
  const [weeklyGoal, setWeeklyGoal] = useState(100);
  useEffect(() => {
    setDailyGoal(Math.max(5, Math.min(200, Number(localStorage.getItem("snoozelet-daily-goal")) || 20)));
    setWeeklyGoal(Math.max(25, Math.min(1000, Number(localStorage.getItem("snoozelet-weekly-goal")) || 100)));
  }, []);
  const achievements = useMemo(() => [
    ["First step", totalXp > 0, "Complete your first review"], ["On a roll", bestStreak >= 10, "Reach a 10-answer streak"],
    ["Consistent", summary.streak >= 7, "Study for 7 days in a row"], ["Level ten", level >= 10, "Reach level 10"],
    ["Century", summary.weeklyReviews >= 100, "Complete 100 reviews in a week"], ["Deck master", summary.mastery.some((deck) => deck.percent === 100 && deck.cards > 0), "Master an entire deck"],
  ], [bestStreak, level, summary, totalXp]);
  const goalPercent = Math.min(100, Math.round((summary.todayReviews / dailyGoal) * 100));
  function changeGoal(value) { const next = Math.max(5, Math.min(200, Number(value) || 20)); setDailyGoal(next); localStorage.setItem("snoozelet-daily-goal", String(next)); }
  function changeWeeklyGoal(value) { const next = Math.max(25, Math.min(1000, Number(value) || 100)); setWeeklyGoal(next); localStorage.setItem("snoozelet-weekly-goal", String(next)); }
  return <>
    <section className="motivation-grid"><article className="daily-goal-card"><div><p className="eyebrow">Daily goal</p><h2>{summary.todayReviews} / {dailyGoal} reviews</h2></div><label>Goal<select value={dailyGoal} onChange={(event) => changeGoal(event.target.value)}>{[10,20,30,50,100].map((goal) => <option value={goal} key={goal}>{goal}</option>)}</select></label><div className="goal-track"><span style={{ width: `${goalPercent}%` }} /></div><p>{goalPercent >= 100 ? "Goal complete — excellent work!" : `${dailyGoal - summary.todayReviews} reviews to go.`}</p></article><article><p className="eyebrow">Current streak</p><h2>{summary.streak} days</h2><p>Come back tomorrow to keep it growing.</p></article><article><p className="eyebrow">Weekly goal</p><h2>{summary.weeklyReviews} / {weeklyGoal}</h2><label>Goal <select value={weeklyGoal} onChange={(event) => changeWeeklyGoal(event.target.value)}>{[50,100,150,250,500].map((goal) => <option value={goal} key={goal}>{goal}</option>)}</select></label><div className="goal-track"><span style={{ width: `${Math.min(100,(summary.weeklyReviews / weeklyGoal) * 100)}%` }} /></div><p>{summary.weeklyReviews ? `${Math.round((summary.weeklyCorrect / summary.weeklyReviews) * 100)}% correct this week.` : "Your weekly summary will appear after studying."}</p></article></section>
    <section className="progress-section"><h2>Achievements</h2><div className="achievement-grid">{achievements.map(([name, earned, detail]) => <article className={earned ? "earned" : "locked"} key={name}><span aria-hidden="true">{earned ? "★" : "○"}</span><div><strong>{name}</strong><small>{detail}</small></div></article>)}</div></section>
    <section className="progress-section"><h2>Deck mastery</h2><div className="mastery-list">{summary.mastery.map((deck) => <article key={deck.id}><div><strong>{deck.title}</strong><span>{deck.mastered} of {deck.cards} mastered</span></div><div className="goal-track"><span style={{ width: `${deck.percent}%` }} /></div><b>{deck.percent}%</b></article>)}</div></section>
    <section className="progress-section"><h2>Study activity</h2><div className="activity-heatmap" aria-label="Study activity over the last 12 weeks">{Array.from({ length: 84 }, (_, index) => { const date = new Date(); date.setUTCDate(date.getUTCDate() - (83 - index)); const day = date.toISOString().slice(0,10); const count = Number(summary.activity.find((item) => item.day === day)?.reviews || 0); return <span title={`${day}: ${count} reviews`} className={`heat-${Math.min(4, Math.ceil(count / 5))}`} key={day} />; })}</div></section>
  </>;
}
