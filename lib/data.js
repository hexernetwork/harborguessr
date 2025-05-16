import { createClient } from "@supabase/supabase-js"

// Function to initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase credentials not available")
    return null
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

// Function to get user's preferred language from localStorage
export function getUserLanguage() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("language") || "en"
  }
  return "en"
}

// Function to set user's preferred language in localStorage
export function setUserLanguage(lang) {
  if (typeof window !== "undefined") {
    localStorage.setItem("language", lang)
  }
}

// Simplified multilingual data structure with a few examples
export const multilingualData = {
  en: {
    harbors: [
      {
        id: 1,
        name: "Elisaari",
        coordinates: { lat: 60.0167, lng: 23.9333 },
        region: "Western Uusimaa",
        type: ["Guest Marina", "Nature Harbor"],
        notableFeature: "Beautiful island with a restaurant and nature trails",
        description:
          "Elisaari is a popular guest marina in the western archipelago of Uusimaa. The island offers beautiful nature trails, a restaurant, and sauna facilities for visitors. It's a peaceful destination with good protection from winds.",
        hints: [
          "This harbor is located on an island in Western Uusimaa",
          "The island has a restaurant and nature trails",
          "It's a popular destination for family boating trips",
          "The name starts with 'E'",
          "It's located near Inkoo",
        ],
      },
      {
        id: 2,
        name: "Örö",
        coordinates: { lat: 59.8089, lng: 22.3347 },
        region: "Archipelago Sea",
        type: ["Guest Marina", "Historical"],
        notableFeature: "Former military island with unique nature and historical fortifications",
        description:
          "Örö is a fascinating former military island in the outer archipelago that was opened to the public in 2015. It features rare flora, historical coastal artillery fortifications, and a guest harbor with modern facilities.",
        hints: [
          "This harbor is on a former military island",
          "It's located in the Archipelago Sea National Park",
          "The island has rare flora and coastal artillery fortifications",
          "The name is very short",
          "It starts with the letter 'Ö'",
        ],
      },
      {
        id: 3,
        name: "Jurmo",
        coordinates: { lat: 59.8272, lng: 21.5772 },
        region: "Outer Archipelago Sea",
        type: ["Guest Marina", "Traditional"],
        notableFeature: "Remote island with unique geology and traditional archipelago village",
        description:
          "Jurmo is a remote, barren island in the outer archipelago with a distinctive landscape formed by ice age glaciers. It has a small traditional village, a guest harbor, and is known for its unique nature and bird watching opportunities.",
        hints: [
          "This harbor is on a remote, barren island in the outer archipelago",
          "The island has a distinctive landscape formed by ice age glaciers",
          "It's known for bird watching and unique nature",
          "The island has a small traditional village",
          "The name rhymes with 'Turmo'",
        ],
      },
    ],
    triviaQuestions: [
      {
        question: "Which Finnish guest marina is located on a former leper colony island?",
        answers: ["Utö", "Seili", "Jurmo", "Kökar"],
        correctAnswer: 1,
        explanation:
          "Seili (Själö in Swedish) was a former leper colony and later a mental hospital island. Today it houses a biological research station and offers a guest marina for visitors.",
      },
      {
        question: "Which Finnish archipelago harbor is Finland's southernmost year-round inhabited island?",
        answers: ["Jurmo", "Utö", "Örö", "Kökar"],
        correctAnswer: 1,
        explanation:
          "Utö is Finland's southernmost year-round inhabited island, featuring a historic lighthouse, a small village, and a guest marina.",
      },
      {
        question: "Which guest marina is located on a former military island with coastal artillery fortifications?",
        answers: ["Örö", "Aspö", "Jussarö", "Boistö"],
        correctAnswer: 0,
        explanation:
          "Örö is a fascinating former military island that was opened to the public in 2015. It features rare flora, historical coastal artillery fortifications, and a guest harbor with modern facilities.",
      },
    ],
  },
  fi: {
    harbors: [
      {
        id: 1,
        name: "Elisaari",
        coordinates: { lat: 60.0167, lng: 23.9333 },
        region: "Länsi-Uusimaa",
        type: ["Vierasvenesatama", "Luontosatama"],
        notableFeature: "Kaunis saari, jossa ravintola ja luontopolkuja",
        description:
          "Elisaari on suosittu vierasvenesatama Uudenmaan läntisessä saaristossa. Saarella on kauniita luontopolkuja, ravintola ja saunatilat vierailijoille. Se on rauhallinen kohde, joka tarjoaa hyvän suojan tuulilta.",
        hints: [
          "Tämä satama sijaitsee saarella Länsi-Uudellamaalla",
          "Saarella on ravintola ja luontopolkuja",
          "Se on suosittu kohde perheiden veneilymatkoille",
          "Nimi alkaa kirjaimella 'E'",
          "Se sijaitsee lähellä Inkoota",
        ],
      },
      {
        id: 2,
        name: "Örö",
        coordinates: { lat: 59.8089, lng: 22.3347 },
        region: "Saaristomeri",
        type: ["Vierasvenesatama", "Historiallinen"],
        notableFeature: "Entinen sotilassaari, jossa ainutlaatuinen luonto ja historialliset linnoitukset",
        description:
          "Örö on kiehtova entinen sotilassaari ulkosaaristossa, joka avattiin yleisölle vuonna 2015. Siellä on harvinaista kasvillisuutta, historiallisia rannikkotykistön linnoituksia ja vierasvenesatama nykyaikaisilla palveluilla.",
        hints: [
          "Tämä satama on entisellä sotilassaarella",
          "Se sijaitsee Saaristomeren kansallispuistossa",
          "Saarella on harvinaista kasvillisuutta ja rannikkotykistön linnoituksia",
          "Nimi on hyvin lyhyt",
          "Se alkaa kirjaimella 'Ö'",
        ],
      },
      {
        id: 3,
        name: "Jurmo",
        coordinates: { lat: 59.8272, lng: 21.5772 },
        region: "Ulkosaaristomeri",
        type: ["Vierasvenesatama", "Perinteinen"],
        notableFeature: "Syrjäinen saari, jossa ainutlaatuinen geologia ja perinteinen saaristokylä",
        description:
          "Jurmo on syrjäinen, karu saari ulkosaaristossa, jolla on jääkauden jäätiköiden muovaama maisema. Siellä on pieni perinteinen kylä, vierasvenesatama ja se tunnetaan ainutlaatuisesta luonnostaan ja lintujen tarkkailumahdollisuuksistaan.",
        hints: [
          "Tämä satama on syrjäisellä, karulla saarella ulkosaaristossa",
          "Saarella on jääkauden jäätiköiden muovaama maisema",
          "Se tunnetaan lintujen tarkkailusta ja ainutlaatuisesta luonnosta",
          "Saarella on pieni perinteinen kylä",
          "Nimi rimmaa sanan 'Turmo' kanssa",
        ],
      },
    ],
    triviaQuestions: [
      {
        question: "Mikä suomalainen vierasvenesatama sijaitsee entisellä spitaalisten siirtokuntasaarella?",
        answers: ["Utö", "Seili", "Jurmo", "Kökar"],
        correctAnswer: 1,
        explanation:
          "Seili (ruotsiksi Själö) oli entinen spitaalisten siirtokunta ja myöhemmin mielisairaalasaari. Nykyään siellä toimii biologinen tutkimusasema ja vierasvenesatama vierailijoille.",
      },
      {
        question: "Mikä suomalainen saaristosatama on Suomen eteläisin ympärivuotisesti asuttu saari?",
        answers: ["Jurmo", "Utö", "Örö", "Kökar"],
        correctAnswer: 1,
        explanation:
          "Utö on Suomen eteläisin ympärivuotisesti asuttu saari, jossa on historiallinen majakka, pieni kylä ja vierasvenesatama.",
      },
      {
        question: "Mikä vierasvenesatama sijaitsee entisellä sotilassaarella, jossa on rannikkotykistön linnoituksia?",
        answers: ["Örö", "Aspö", "Jussarö", "Boistö"],
        correctAnswer: 0,
        explanation:
          "Örö on kiehtova entinen sotilassaari, joka avattiin yleisölle vuonna 2015. Siellä on harvinaista kasvillisuutta, historiallisia rannikkotykistön linnoituksia ja vierasvenesatama nykyaikaisilla palveluilla.",
      },
    ],
  },
  sv: {
    harbors: [
      {
        id: 1,
        name: "Elisaari",
        coordinates: { lat: 60.0167, lng: 23.9333 },
        region: "Västra Nyland",
        type: ["Gästhamn", "Naturhamn"],
        notableFeature: "Vacker ö med restaurang och naturstigar",
        description:
          "Elisaari är en populär gästhamn i den västra skärgården i Nyland. Ön erbjuder vackra naturstigar, en restaurang och bastuanläggningar för besökare. Det är en fridfull destination med bra skydd från vindar.",
        hints: [
          "Denna hamn ligger på en ö i Västra Nyland",
          "Ön har en restaurang och naturstigar",
          "Det är ett populärt resmål för familjebåtturer",
          "Namnet börjar med 'E'",
          "Den ligger nära Ingå",
        ],
      },
      {
        id: 2,
        name: "Örö",
        coordinates: { lat: 59.8089, lng: 22.3347 },
        region: "Skärgårdshavet",
        type: ["Gästhamn", "Historisk"],
        notableFeature: "Tidigare militärö med unik natur och historiska befästningar",
        description:
          "Örö är en fascinerande tidigare militärö i ytterskärgården som öppnades för allmänheten 2015. Den har sällsynt flora, historiska kustartilleribefästningar och en gästhamn med moderna faciliteter.",
        hints: [
          "Denna hamn ligger på en tidigare militärö",
          "Den ligger i Skärgårdshavets nationalpark",
          "Ön har sällsynt flora och kustartilleribefästningar",
          "Namnet är mycket kort",
          "Det börjar med bokstaven 'Ö'",
        ],
      },
      {
        id: 3,
        name: "Jurmo",
        coordinates: { lat: 59.8272, lng: 21.5772 },
        region: "Yttre Skärgårdshavet",
        type: ["Gästhamn", "Traditionell"],
        notableFeature: "Avlägsen ö med unik geologi och traditionell skärgårdsby",
        description:
          "Jurmo är en avlägsen, karg ö i ytterskärgården med ett distinkt landskap format av istida glaciärer. Den har en liten traditionell by, en gästhamn och är känd för sin unika natur och fågelskådningsmöjligheter.",
        hints: [
          "Denna hamn ligger på en avlägsen, karg ö i ytterskärgården",
          "Ön har ett distinkt landskap format av istida glaciärer",
          "Den är känd för fågelskådning och unik natur",
          "Ön har en liten traditionell by",
          "Namnet rimmar med 'Turmo'",
        ],
      },
    ],
    triviaQuestions: [
      {
        question: "Vilken finländsk gästhamn ligger på en tidigare spetälskekoloniö?",
        answers: ["Utö", "Själö", "Jurmo", "Kökar"],
        correctAnswer: 1,
        explanation:
          "Själö (Seili på finska) var tidigare en spetälskekoloni och senare en mentalsjukhusö. Idag finns där en biologisk forskningsstation och en gästhamn för besökare.",
      },
      {
        question: "Vilken finländsk skärgårdshamn är Finlands sydligaste året-runt bebodda ö?",
        answers: ["Jurmo", "Utö", "Örö", "Kökar"],
        correctAnswer: 1,
        explanation:
          "Utö är Finlands sydligaste året-runt bebodda ö, med en historisk fyr, en liten by och en gästhamn.",
      },
      {
        question: "Vilken gästhamn ligger på en tidigare militärö med kustartilleribefästningar?",
        answers: ["Örö", "Aspö", "Jussarö", "Boistö"],
        correctAnswer: 0,
        explanation:
          "Örö är en fascinerande tidigare militärö som öppnades för allmänheten 2015. Den har sällsynt flora, historiska kustartilleribefästningar och en gästhamn med moderna faciliteter.",
      },
    ],
  },
}

// Function to upload data to Supabase
export async function uploadDataToSupabase() {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return { success: false, error: new Error("Supabase client not initialized") }
  }

  try {
    // Upload harbors
    for (const lang in multilingualData) {
      const langData = multilingualData[lang]

      // Upload harbors
      for (const harbor of langData.harbors) {
        // Insert harbor data
        const { error: harborError } = await supabase.from("harbors").upsert(
          {
            id: harbor.id,
            name: harbor.name,
            coordinates: harbor.coordinates,
            region: harbor.region,
            type: harbor.type,
            notable_feature: harbor.notableFeature,
            description: harbor.description,
            language: lang,
          },
          { onConflict: "id,language" },
        )

        if (harborError) throw harborError

        // Insert hints for this harbor
        for (let i = 0; i < harbor.hints.length; i++) {
          const { error: hintError } = await supabase.from("harbor_hints").upsert(
            {
              harbor_id: harbor.id,
              hint_order: i + 1,
              hint_text: harbor.hints[i],
              language: lang,
            },
            { onConflict: "harbor_id,hint_order,language" },
          )

          if (hintError) throw hintError
        }
      }

      // Upload trivia questions
      for (let i = 0; i < langData.triviaQuestions.length; i++) {
        const question = langData.triviaQuestions[i]
        const { error: questionError } = await supabase.from("trivia_questions").upsert(
          {
            id: i + 1,
            question: question.question,
            answers: question.answers,
            correct_answer: question.correctAnswer,
            explanation: question.explanation,
            language: lang,
          },
          { onConflict: "id,language" },
        )

        if (questionError) throw questionError
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error uploading data to Supabase:", error)
    return { success: false, error }
  }
}

// Function to seed the database
export async function seedDatabase() {
  try {
    const result = await uploadDataToSupabase()
    return result
  } catch (error) {
    console.error("Error seeding database:", error)
    return { success: false, error }
  }
}

// Function to fetch harbor data
export async function fetchHarborData(lang = null) {
  const language = lang || getUserLanguage()
  const supabase = getSupabaseClient()

  if (!supabase) {
    // Fallback to local data if Supabase is not available
    return multilingualData[language]?.harbors || multilingualData.en.harbors
  }

  try {
    // Fetch harbors from Supabase
    const { data: harbors, error: harborError } = await supabase.from("harbors").select("*").eq("language", language)

    if (harborError) throw harborError

    // If no harbors found for this language, fall back to English
    if (!harbors || harbors.length === 0) {
      if (language !== "en") {
        const { data: enHarbors, error: enError } = await supabase.from("harbors").select("*").eq("language", "en")

        if (enError) throw enError
        return enHarbors || multilingualData.en.harbors
      }
      return multilingualData.en.harbors
    }

    // Fetch hints for each harbor
    const harborsWithHints = await Promise.all(
      harbors.map(async (harbor) => {
        const { data: hints, error: hintError } = await supabase
          .from("harbor_hints")
          .select("hint_text")
          .eq("harbor_id", harbor.id)
          .eq("language", language)
          .order("hint_order")

        if (hintError) throw hintError

        return {
          ...harbor,
          hints: hints ? hints.map((h) => h.hint_text) : [],
        }
      }),
    )

    return harborsWithHints
  } catch (error) {
    console.error("Error fetching harbor data:", error)
    // Fallback to local data on error
    return multilingualData[language]?.harbors || multilingualData.en.harbors
  }
}

// Function to fetch trivia questions
export async function fetchHarborTrivia(lang = null) {
  const language = lang || getUserLanguage()
  const supabase = getSupabaseClient()

  if (!supabase) {
    // Fallback to local data if Supabase is not available
    return multilingualData[language]?.triviaQuestions || multilingualData.en.triviaQuestions
  }

  try {
    // Fetch trivia questions from Supabase
    const { data: questions, error } = await supabase.from("trivia_questions").select("*").eq("language", language)

    if (error) throw error

    // If no questions found for this language, fall back to English
    if (!questions || questions.length === 0) {
      if (language !== "en") {
        const { data: enQuestions, error: enError } = await supabase
          .from("trivia_questions")
          .select("*")
          .eq("language", "en")

        if (enError) throw enError
        return enQuestions || multilingualData.en.triviaQuestions
      }
      return multilingualData.en.triviaQuestions
    }

    return questions
  } catch (error) {
    console.error("Error fetching trivia questions:", error)
    // Fallback to local data on error
    return multilingualData[language]?.triviaQuestions || multilingualData.en.triviaQuestions
  }
}
