"use client";

import { useState } from "react";
import ClassicQuiz from "@/components/ClassicQuiz";
import QuoteQuiz from "@/components/QuoteQuiz";
import AbilityQuiz from "@/components/AbilityQuiz";

type TestTab = "classic" | "quote" | "ability";

export default function TestPage() {
  const [tab, setTab] = useState<TestTab>("classic");

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex gap-1 mb-6 border-b border-border">
        {(["classic", "quote", "ability"] as TestTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "classic" && <ClassicQuiz />}
      {tab === "quote" && <QuoteQuiz />}
      {tab === "ability" && <AbilityQuiz />}
    </div>
  );
}
