"use client"

import Link from "next/link"
import { ArrowLeft, Ship, Map, Info, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"

export default function AboutContent() {
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
                <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                {t("about.title")}
              </h1>
            </div>

            <div className="p-6 space-y-6">
              <section>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                  <Ship className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  {t("about.projectTitle")}
                </h2>
                <p className="text-slate-600 dark:text-slate-300">{t("about.projectDescription")}</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                  <Map className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  {t("about.howItWorksTitle")}
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-4">{t("about.howItWorksDescription")}</p>
                <div className="space-y-4">
                  <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                    <h3 className="font-medium text-slate-800 dark:text-white mb-2">{t("about.locationGameTitle")}</h3>
                    <p className="text-slate-600 dark:text-slate-300">{t("about.locationGameDescription")}</p>
                    <div className="mt-4">
                      <Link href="/location-game">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                          {t("home.playLocationGame")}
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                    <h3 className="font-medium text-slate-800 dark:text-white mb-2">{t("about.triviaGameTitle")}</h3>
                    <p className="text-slate-600 dark:text-slate-300">{t("about.triviaGameDescription")}</p>
                    <div className="mt-4">
                      <Link href="/trivia-game">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">{t("home.playTriviaGame")}</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">
                  {t("about.dataSourcesTitle")}
                </h2>
                <p className="text-slate-600 dark:text-slate-300">{t("about.dataSourcesDescription")}</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">
                  {t("about.mapAttributionTitle")}
                </h2>
                <p className="text-slate-600 dark:text-slate-300">
                  {t("about.mapAttributionDescription")}{" "}
                  <a
                    href="https://www.openstreetmap.org/copyright"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
                  >
                    OpenStreetMap contributors <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </p>
                <p className="text-slate-600 dark:text-slate-300 mt-2">
                  {t("about.mapAttributionLicense")}{" "}
                  <a
                    href="https://www.openstreetmap.org/copyright"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
                  >
                    Open Data Commons Open Database License (ODbL) <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
