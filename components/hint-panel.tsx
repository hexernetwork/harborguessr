import { Anchor, Building, Compass, Ship } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function HintPanel({ harbor, hintLevel, guessed }) {
  if (!harbor) return null

  return (
    <div className="space-y-4">
      {hintLevel >= 1 && (
        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Compass className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-medium text-slate-800 dark:text-white">Region</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">{harbor.region}</p>
        </div>
      )}

      {hintLevel >= 2 && (
        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Ship className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-medium text-slate-800 dark:text-white">Harbor Type</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {harbor.type.map((type, index) => (
              <Badge key={index} variant="secondary">
                {type}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {hintLevel >= 3 && (
        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-medium text-slate-800 dark:text-white">Notable Feature</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">{harbor.notableFeature}</p>
        </div>
      )}

      {hintLevel === 0 && !guessed && (
        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
          <Anchor className="h-8 w-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Use hints to learn more about this harbor, but remember - each hint reduces your potential score!
          </p>
        </div>
      )}
    </div>
  )
}
