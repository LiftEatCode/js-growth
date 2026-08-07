import { getAuditGrade } from "@/lib/website-audit/grading";

interface AuditGradeGaugeProps {
  score: number;
  size?: number;
}

function getStrokeClass(
  color: string,
): string {
  if (color === "emerald") {
    return "stroke-emerald-500";
  }

  if (color === "blue") {
    return "stroke-blue-500";
  }

  if (color === "amber") {
    return "stroke-amber-500";
  }

  return "stroke-destructive";
}

function getTextClass(
  color: string,
): string {
  if (color === "emerald") {
    return "text-emerald-700 dark:text-emerald-400";
  }

  if (color === "blue") {
    return "text-blue-700 dark:text-blue-400";
  }

  if (color === "amber") {
    return "text-amber-700 dark:text-amber-400";
  }

  return "text-destructive";
}

export function AuditGradeGauge({
  score,
  size = 220,
}: AuditGradeGaugeProps) {
  const normalizedScore = Math.min(
    Math.max(score, 0),
    100,
  );

  const grade = getAuditGrade(
    normalizedScore,
  );

  const radius = 84;
  const circumference =
    2 * Math.PI * radius;

  const strokeOffset =
    circumference -
    (normalizedScore / 100) *
      circumference;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: size,
        height: size,
      }}
    >
      <svg
        viewBox="0 0 200 200"
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          strokeWidth="12"
          className="stroke-muted"
        />

        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={
            circumference
          }
          strokeDashoffset={
            strokeOffset
          }
          className={`${getStrokeClass(
            grade.color,
          )} transition-[stroke-dashoffset] duration-700 ease-out`}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          SEO Grade
        </span>

        <span
          className={`mt-1 text-6xl font-bold tracking-tight ${getTextClass(
            grade.color,
          )}`}
        >
          {grade.letter}
        </span>

        <span className="mt-1 text-lg font-semibold text-foreground">
          {normalizedScore}/100
        </span>

        <span className="mt-1 text-sm text-muted-foreground">
          {grade.label}
        </span>
      </div>
    </div>
  );
}