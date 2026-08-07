export interface AuditGrade {
    letter: string;
    label: string;
    color: string;
  }
  
  export function getAuditGrade(
    score: number,
  ): AuditGrade {
    if (score >= 97)
      return {
        letter: "A+",
        label: "Exceptional",
        color: "emerald",
      };
  
    if (score >= 93)
      return {
        letter: "A",
        label: "Excellent",
        color: "emerald",
      };
  
    if (score >= 90)
      return {
        letter: "A-",
        label: "Very Strong",
        color: "emerald",
      };
  
    if (score >= 87)
      return {
        letter: "B+",
        label: "Strong",
        color: "blue",
      };
  
    if (score >= 83)
      return {
        letter: "B",
        label: "Good",
        color: "blue",
      };
  
    if (score >= 80)
      return {
        letter: "B-",
        label: "Above Average",
        color: "blue",
      };
  
    if (score >= 77)
      return {
        letter: "C+",
        label: "Needs Improvement",
        color: "amber",
      };
  
    if (score >= 73)
      return {
        letter: "C",
        label: "Needs Work",
        color: "amber",
      };
  
    if (score >= 70)
      return {
        letter: "C-",
        label: "Needs Attention",
        color: "amber",
      };
  
    if (score >= 60)
      return {
        letter: "D",
        label: "Poor",
        color: "red",
      };
  
    return {
      letter: "F",
      label: "Critical",
      color: "red",
    };
  }