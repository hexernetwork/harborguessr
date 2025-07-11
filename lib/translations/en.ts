// English translations
const en = {
  common: {
    loading: "Loading...",
    error: "Error",
    tryAgain: "Try Again",
    returnHome: "Return to Home",
    next: "Next",
    back: "Back",
    submit: "Submit",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    view: "View",
    search: "Search",
    find: "Find",
    ok: "OK",
    yes: "Yes",
    no: "No",
    close: "Close",
    confirm: "Confirm",
    seeMore: "See More",
    seeLess: "See Less",
    showMore: "Show More",
    showLess: "Show Less",
    noResults: "No results found",
    noData: "No data available",
    success: "Success",
    warning: "Warning",
    info: "Information",
    user: "User",
    userAvatar: "User Avatar",
    signingOut: "Signing out...",
    openStreetMapContributors: "OpenStreetMap contributors",
    openStreetMapLicense: "Open Data Commons Open Database License (ODbL)",
    continue: "Continue"
  },
  navigation: {
    home: "Home",
    locationGame: "Location Game",
    triviaGame: "Trivia Game",
    leaderboard: "Leaderboard",
    about: "About",
    howToPlay: "How to Play",
    profile: "Profile",
    settings: "Settings",
    signIn: "Sign In",
    signUp: "Sign Up",
    signOut: "Sign Out",
    toggleMenu: "Toggle menu",
  },
  home: {
    title: "Finnish Harbor Guesser",
    titleShort: "Harbor Guesser",
    subtitle: "Navigate the nautical charts to find harbors across Finland",
    locationGameTitle: "Harbor Location Guesser",
    locationGameDescription:
      "Find Finnish harbors on nautical charts using progressive hints. Each wrong guess reveals a new hint!",
    triviaGameTitle: "Harbor Trivia",
    triviaGameDescription: "Test your knowledge about Finnish harbors with our trivia challenge.",
    playLocationGame: "Play Location Game",
    playTriviaGame: "Play Trivia Game",
    footer: "Learn about Finland's maritime heritage while having fun!",
  },
  locationGame: {
    title: "Find this Harbor",
    mapTitle: "Map of Finnish Harbors",
    mapDescription: "Use the map to find the harbor location. Try different map styles with the layers button.",
    round: "Round",
    guessesRemaining: "Guesses remaining",
    locationSelected: "Location selected",
    clickToSelect: "Click on map to select location",
    confirmGuess: "Confirm Guess",
    clickMapTip: "Click on the map to select a location, then confirm your guess",
    nextHarbor: "Next Harbor",
    seeFinalScore: "See Final Score",
    showHarborNames: "Show Harbor Names",
    searchHarbor: "Search harbor by name...",
    hints: "Hints",
    hintsRevealed: "hints revealed",
    hintLocked: "Hint {number} - Locked",
    noHints: "No hints available for this harbor.",
    correct: "Correct!",
    gameOver: "Game Over",
    tryAgain: "Try Again",
    correctMessage: "Great job! You found {harborName}. You earned {score} points.",
    outOfGuesses: "Out of guesses! The correct location was {harborName}.",
    distanceAway: "Your guess was {distance} km away. Try again! ({guessesLeft} guesses left)",
    distance: "Distance",
    guess: "Guess",
    finalScore: "Game Over! Final Score: {score}",
    harbor: "Harbor",
    region: "Region",
    type: "Type",
    description: "Description",
    searchedLocation: "Searched Location",
    yourGuess: "Your guess",
    actualLocation: "Actual location",
    previousGuesses: "Previous Guesses",
    savedGameFound: "Saved Game Found",
    savedGameSubtitle: "Would you like to continue your saved game or start fresh?",
    gameComplete: "Game Complete!",
    playAgain: "Play Again",
    imageHint: "Harbor Photo:",
    imageNotAvailable: "Image not available",
    noImageAvailable: "No image available for this harbor",
    replaceImage: "Replace Image",
    uploadNewImage: "Upload New Image",
    removeImage: "Remove Image",
    imageUploadSuccess: "Image uploaded successfully!",
    imageUploadError: "Failed to upload image. Please try again.",
    imageRemoved: "Image removed successfully.",
  },
  triviaGame: {
    title: "Harbor Trivia",
    question: "Question",
    timeLeft: "s",
    nextQuestion: "Next Question",
    seeFinalScore: "See Final Score",
    noQuestions: "No Questions Available",
    noQuestionsMessage: "No trivia questions are currently available. Please try again later.",
    loadingQuestions: "Loading trivia questions...",
    errorLoadingQuestions: "Failed to load trivia questions. Please try again later.",
    finalScore: "Game Over! Final Score: {score}",
    correctAnswers: "Correct Answers",
    incorrectAnswers: "Incorrect Answers",
    timeBonus: "Time Bonus",
    totalScore: "Total Score",
    answeredCorrectly: "You answered correctly!",
    answeredIncorrectly: "You answered incorrectly!",
    correctAnswer: "Correct answer",
    yourAnswer: "Your answer",
    explanation: "Explanation",
    timeRanOut: "Time ran out!",
  },
  about: {
    title: "About Finnish Harbor Guesser",
    projectTitle: "The Project",
    projectDescription:
      "Finnish Harbor Guesser is an educational game designed to help users learn about Finland's diverse harbors, marinas, and ports. From the bustling commercial ports of Helsinki and Turku to the remote guest harbors in the outer archipelago, Finland offers a rich maritime landscape to explore.",
    howItWorksTitle: "How It Works",
    howItWorksDescription: "The application offers two main game modes:",
    locationGameTitle: "Location Game",
    locationGameDescription:
      "Test your geographical knowledge by finding Finnish harbors on the map. You'll be given hints and need to pinpoint the location as accurately as possible. The closer your guess, the more points you'll earn!",
    triviaGameTitle: "Trivia Game",
    triviaGameDescription:
      "Challenge your knowledge about Finnish harbors with our trivia questions. Learn interesting facts about Finland's maritime history, geography, and culture while having fun!",
    dataSourcesTitle: "Data Sources",
    dataSourcesDescription:
      "The harbor data used in this application has been compiled from various sources, including official maritime charts, harbor guides, and local knowledge. While we strive for accuracy, the information should not be used for actual navigation purposes.",
    mapAttributionTitle: "Map Attribution",
    mapAttributionDescription: "Map data © OpenStreetMap contributors",
    mapAttributionLicense:
      "This application uses map tiles from OpenStreetMap, which is open data, licensed under the Open Data Commons Open Database License (ODbL)",
  },
  howToPlay: {
    title: "How to Play",
    locationGameTitle: "Location Game",
    locationGameDescription:
      "The Location Game tests your knowledge of Finnish harbors and their geographical locations. Here's how to play:",
    locationGameSteps: [
      {
        title: "Start the game",
        description: "You'll be presented with a harbor to find and some initial hints about its location.",
      },
      {
        title: "Read the hints",
        description: "Use the provided hints to narrow down the possible location of the harbor.",
      },
      {
        title: "Make your guess",
        description:
          "Click on the map where you think the harbor is located. You can adjust your selection before confirming.",
      },
      {
        title: "Confirm your guess",
        description: 'Once you\'re confident in your selection, click the "Confirm Guess" button.',
      },
      {
        title: "See the results",
        description:
          "You'll be shown how close your guess was to the actual location. If you're within 20km, your guess is considered correct!",
      },
      {
        title: "Continue playing",
        description: "Each game consists of 5 rounds. Try to score as many points as possible!",
      },
    ],
    locationGameScoring:
      "Scoring: The closer your guess and the fewer hints you use, the more points you'll earn. A perfect score is 100 points per harbor.",
    triviaGameTitle: "Trivia Game",
    triviaGameDescription:
      "The Trivia Game tests your knowledge about Finnish harbors, maritime history, and coastal features. Here's how to play:",
    triviaGameSteps: [
      {
        title: "Start the game",
        description: "You'll be presented with a multiple-choice question about Finnish harbors.",
      },
      {
        title: "Select your answer",
        description: "Choose the answer you believe is correct from the options provided.",
      },
      { title: "Submit your answer", description: 'Click the "Submit Answer" button to check if you\'re correct.' },
      {
        title: "Learn from the explanation",
        description:
          "Whether right or wrong, you'll be shown an explanation that provides more information about the topic.",
      },
      {
        title: "Continue playing",
        description: "Each game consists of 10 questions. Try to answer as many correctly as possible!",
      },
    ],
    triviaGameScoring: "Scoring: Each correct answer earns you 10 points. A perfect score is 100 points.",
    tipsTitle: "Tips for Success",
    tips: [
      "Pay attention to the region mentioned in the hints - Finland is a large country!",
      "Learn the geography of Finland's major lakes and coastal areas to better understand where harbors might be located.",
      "Use the \"Show Harbor Names\" option in the Location Game if you're struggling - it's a great way to learn!",
      "Remember that archipelago harbors are often clustered in certain areas, while inland harbors follow the major lake systems.",
    ],
  },
  auth: {
    signIn: "Sign In",
    signUp: "Sign Up",
    signOut: "Sign Out",
    email: "Email",
    password: "Password",
    forgotPassword: "Forgot password?",
    confirmPassword: "Confirm Password",
    username: "Username",
    fullName: "Full Name",
    createAccount: "Create Account",
    alreadyHaveAccount: "Already have an account?",
    dontHaveAccount: "Don't have an account?",
    resetPassword: "Reset Password",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New Password",
    passwordRequirements: "Password must be at least 6 characters long",
    welcomeBack: "Welcome back",
    signInDescription: "Sign in to your account to continue",
    createAccountDescription: "Enter your details to create your account",
    forgotPasswordDescription: "Enter your email address and we'll send you a link to reset your password",
    resetPasswordDescription: "Enter your new password below",
    resetPasswordSuccess: "Password reset successful! You can now sign in with your new password.",
    registrationSuccess: "Registration successful! Please check your email to verify your account, then sign in.",
    rememberPassword: "Remember your password?",
    backToLogin: "Back to login",
    sendResetLink: "Send Reset Link",
    resetLinkSent: "Password reset link has been sent to your email address. Please check your inbox.",
    signingOut: "Signing out...",
    user: "User",
    userAvatar: "User Avatar",
    noAccount: "No Account?",
  },
  profile: {
    title: "Profile",
    memberSince: "Member since",
    gamesPlayed: "Games played",
    highestLocationScore: "Highest location score",
    highestTriviaScore: "Highest trivia score",
    accountSettings: "Account Settings",
    gameStatistics: "Game Statistics",
    locationGame: "Location Game",
    triviaGame: "Trivia Game",
    viewAllGameHistory: "View All Game History",
    recentActivity: "Recent Activity",
    noGamesPlayed: "You haven't played any games yet.",
    profileUnavailable: "Profile Unavailable",
    profileUnavailableMessage: "Unable to load profile information. Please try again later.",
  },
  settings: {
    title: "Settings",
    language: "Language",
    theme: "Theme",
    notifications: "Notifications",
    privacy: "Privacy",
    account: "Account",
    save: "Save Changes",
    cancel: "Cancel",
    deleteAccount: "Delete Account",
    deleteAccountWarning: "This action cannot be undone. All your data will be permanently deleted.",
    changePassword: "Change Password",
    changeEmail: "Change Email",
    changeUsername: "Change Username",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New Password",
    newEmail: "New Email",
    newUsername: "New Username",
    saveSuccess: "Settings saved successfully!",
    saveError: "Failed to save settings. Please try again.",
  },
  map: {
    standard: "Standard",
    satellite: "Satellite",
    terrain: "Terrain",
    layers: "Map Layers",
    zoomIn: "Zoom In",
    zoomOut: "Zoom Out",
    clickToSelect: "Click on the map to guess the harbor location",
    locationSelected: "Location Selected",
    searchHarbor: "Search harbor by name...",
    findHarbor: "Find Harbor",
    showHarborNames: "Show Harbor Names",
    hideHarborNames: "Hide Harbor Names",
    distance: "Distance",
    km: "km",
    miles: "miles",
    searchResults: "Search Results",
    noSearchResults: "No search results",
    searchPlaceholder: "Search harbor...",
    unknownHarbor: "Unknown Harbor",
    unknownRegion: "Unknown Region",
    unknownType: "Unknown Type",
    changeMapStyle: "Change map style",
    searchedLocation: "Searched Location",
    mapAttribution: "Map data © OpenStreetMap contributors",
  },
  errors: {
    generic: "Something went wrong. Please try again later.",
    notFound: "The page you are looking for does not exist.",
    unauthorized: "You are not authorized to access this page.",
    forbidden: "You do not have permission to access this page.",
    serverError: "Server error. Please try again later.",
    networkError: "Network error. Please check your internet connection.",
    validationError: "Please check your input and try again.",
    authError: "Authentication error. Please sign in again.",
    sessionExpired: "Your session has expired. Please sign in again.",
    incorrectCredentials: "Incorrect email or password.",
    emailAlreadyExists: "Email already exists.",
    usernameAlreadyExists: "Username already exists.",
    passwordMismatch: "Passwords do not match.",
    weakPassword: "Password is too weak.",
    invalidEmail: "Invalid email address.",
    requiredField: "This field is required.",
    minLength: "This field must be at least {length} characters long.",
    maxLength: "This field must be at most {length} characters long.",
    noHarborFound: "No harbor found with that name.",
    invalidLocation: "Invalid location selected.",
    noDataAvailable: "No data available for this request.",
    loadingError: "Error loading data. Please try again.",
  },
  leaderboard: {
  nicknamePrompt: "Want to appear on leaderboard?",
  nicknameDescription: "Enter a nickname to show on the leaderboard:",
  description: "Compete with players from around the world! Complete location and trivia games to climb the rankings. Registered users appear with verified badges, while anonymous players can still compete with nicknames.",
  nicknamePlaceholder: "Your nickname",
  skipLeaderboard: "Skip",
  title: "Leaderboard",
  weeklyTab: "This Week",
  allTimeTab: "All Time",
  noResults: "No results yet",
  rank: "Rank",
  player: "Player",
  score: "Score",
  accuracy: "Accuracy",
  duration: "Duration",
  registered: "Registered",
  anonymous: "Anonymous",
  yourStats: "Your Best Scores",
  gamesPlayed: "Games Played",
  weeklyRank: "Weekly Rank",
  allTimeRank: "All-Time Rank",
  locationGame: "Location",
  triviaGame: "Trivia",
  points: "points",
  noDataYet: "Inga spel spelade än",
  locationGame: "Platsspel",
  triviaGame: "Frågesport", 
  weeklyLeaders: "Veckans ledare",
  },
  gameResults: {
    gameComplete: "Game Complete!",
    finalScore: "Final Score",
    correctAnswers: "Correct Answers",
    totalAttempts: "Total Attempts",
    excellentPerformance: "🎉 Excellent performance!",
    goodJob: "👍 Good job!",
    notBad: "👌 Not bad!",
    practiceMore: "🎯 Practice makes perfect!",
    playAgain: "Play Again",
    questionsCorrect: "Questions Correct",
    outOf: "out of",
    seeLeaderboard: "See Leaderboard"
  },

  gameRestore: {
    savedGameFound: "Saved Game Found",
    savedGameDescription: "Would you like to continue your saved game or start fresh?",
    continueGame: "Continue Game",
    startNewGame: "Start New Game"
  },
  gameSuccess: {
  correct: "Correct!"
  },
}

export default en
