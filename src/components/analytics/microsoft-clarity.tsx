"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";

type MicrosoftClarityProps = {
  projectId: string;
};

export function MicrosoftClarity({ projectId }: MicrosoftClarityProps) {
  useEffect(() => {
    Clarity.init(projectId);
  }, [projectId]);

  return null;
}
