"use client"

import Link from "next/link"
import { ArrowLeft, HelpCircle, Map, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"

export default function HowToPlayContent() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t("common.back")}
            </Button>
          </Link>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                {t("howToPlay.title")}
              </h1>
            </div>

            <div className="p-6 space-y-6">
              <section>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                  <Map className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  {t("howToPlay.locationGameTitle")}
                </h2>
                <div className="space-y-4 text-slate-600 dark:text-slate-300">
                  <p>{t("howToPlay.locationGameDescription")}</p>

                  <ol className="list-decimal list-inside space-y-2">
                    {(Array.isArray(t("howToPlay.locationGameSteps", { returnObjects: true }))
                      ? t("howToPlay.locationGameSteps", { returnObjects: true })
                      : []
                    ).map((step, index) => (
                      <li key={index}>
                        <span className="font-medium">{step?.title || ""}</span> - {step?.description || ""}
                      </li>
                    ))}
                  </ol>

                  <p>
                    <span className="font-medium">{t("howToPlay.locationGameScoring")}</span>
                  </p>

                  <div className="mt-4">
                    <Link href="/location-game">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">{t("home.playLocationGame")}</Button>
                    </Link>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  {t("howToPlay.triviaGameTitle")}
                </h2>
                <div className="space-y-4 text-slate-600 dark:text-slate-300">
                  <p>{t("howToPlay.triviaGameDescription")}</p>

                  <ol className="list-decimal list-inside space-y-2">
                    {(Array.isArray(t("howToPlay.triviaGameSteps", { returnObjects: true }))
                      ? t("howToPlay.triviaGameSteps", { returnObjects: true })
                      : []
                    ).map((step, index) => (
                      <li key={index}>
                        <span className="font-medium">{step?.title || ""}</span> - {step?.description || ""}
                      </li>
                    ))}
                  </ol>

                  <p>
                    <span className="font-medium">{t("howToPlay.triviaGameScoring")}</span>
                  </p>

                  <div className="mt-4">
                    <Link href="/trivia-game">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">{t("home.playTriviaGame")}</Button>
                    </Link>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">
                  {t("howToPlay.tipsTitle")}
                </h2>
                <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
                  {(Array.isArray(t("howToPlay.tips", { returnObjects: true }))
                    ? t("howToPlay.tips", { returnObjects: true })
                    : []
                  ).map((tip, index) => (
                    <li key={index}>{tip || ""}</li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
