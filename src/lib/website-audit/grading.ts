import { getScoreBand } from "./score-bands";

export interface AuditGrade {
  letter: string;
  label: string;
  color: string;
}

function getAuditLetter(score: number): {
  letter: string;
  color: string;
} {
  if (score >= 97) {
    return { letter: "A+", color: "emerald" };
  }

  if (score >= 93) {
    return { letter: "A", color: "emerald" };
  }

  if (score >= 90) {
    return { letter: "A-", color: "emerald" };
  }

  if (score >= 87) {
    return { letter: "B+", color: "blue" };
  }

  if (score >= 83) {
    return { letter: "B", color: "blue" };
  }

  if (score >= 80) {
    return { letter: "B-", color: "blue" };
  }

  if (score >= 77) {
    return { letter: "C+", color: "amber" };
  }

  if (score >= 73) {
    return { letter: "C", color: "amber" };
  }

  if (score >= 70) {
    return { letter: "C-", color: "amber" };
  }

  if (score >= 60) {
    return { letter: "D", color: "red" };
  }

  return { letter: "F", color: "red" };
}

export function getAuditGrade(score: number): AuditGrade {
  const { letter, color } = getAuditLetter(score);

  return {
    letter,
    label: getScoreBand(score).label,
    color,
  };
}
