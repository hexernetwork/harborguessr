import en from './en'
import fi from './fi'
import sv from './sv'

export type Language = 'en' | 'fi' | 'sv'

export const translations = {
  en,
  fi,
  sv,
}

export type TranslationKey = keyof typeof en

export function getTranslation(language: Language, key: string, params?: Record<string, string | number>): string {
  // Split the key by dots to access nested properties
  const keys = key.split('.')
  
  // Get the translation object for the specified language
  let translation: any = translations[language]
  
  // Navigate through the nested properties
  for (const k of keys) {
    if (!translation || !translation[k]) {
      // If the translation is not found, fall back to English
      translation = translations.en
      for (const fallbackKey of keys) {
        if (!translation || !translation[fallbackKey]) {
          return key // Return the key itself if even the fallback fails
        }
        translation = translation[fallbackKey]
      }
      break
    }
    translation = translation[k]
  }
  
  // If the translation is not a string, return the key
  if (typeof translation !== 'string') {
    return key
  }
  
  // Replace parameters in the translation if provided
  if (params) {
    return Object.entries(params).reduce((str, [param, value]) => {
      return str.replace(new RegExp(`{${param}}`, 'g'), String(value))
    }, translation)
  }
  
  return translation
}

export default translations
