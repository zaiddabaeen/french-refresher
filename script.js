// Game state
let currentWordIndex = 0;
let correctCount = 0;
let incorrectAnswers = 0;
let shuffledWords = [];
let hasShownIncorrect = false;
let currentCategory = "verbs";
let wordHistory = [];

// Conjugation practice elements
const vocabularyCard = document.getElementById("vocabulary-card");
const conjugationCard = document.getElementById("conjugation-card");
const conjugationVerb = document.getElementById("conjugation-verb");
const tenseButtons = document.querySelectorAll(".tense-btn");
const conjugationInputs = document.querySelectorAll(".conjugation-input");
const checkConjugationBtn = document.getElementById("check-conjugation-btn");
const revealConjugationBtn = document.getElementById("reveal-conjugation-btn");

let currentTense = "present";
let currentConjugationVerb = "";

// DOM elements
const frenchWordElement = document.getElementById("french-word");
const wordNumberElement = document.getElementById("word-number");
const answerInput = document.getElementById("answer-input");
const submitButton = document.getElementById("submit-btn");
const revealButton = document.getElementById("reveal-btn");
const feedbackMessage = document.getElementById("feedback-message");
const correctAnswerElement = document.getElementById("correct-answer");
const progressBar = document.getElementById("progress");
const progressText = document.getElementById("progress-text");
const correctCountElement = document.getElementById("correct-count");
const incorrectCountElement = document.getElementById("incorrect-count");
const accuracyElement = document.getElementById("accuracy");
const tabButtons = document.querySelectorAll(".tab-btn");

// Custom category elements
const customCard = document.getElementById("custom-card");
const categoryInput = document.getElementById("category-input");
const searchBtn = document.getElementById("search-btn");
const customLoading = document.getElementById("custom-loading");
const customError = document.getElementById("custom-error");
const errorMessage = customError.querySelector(".error-message");

// Initialize LanguageModel session
async function getLanguageModel() {
  try {
    const availablility = await LanguageModel.availability();
    if (availablility === "no") {
      throw new Error("LanguageModel is not available");
    }
    const model = await await LanguageModel.create({
      monitor(m) {
        m.addEventListener("downloadprogress", (e) => {
          console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
          customLoading.textContent = `Downloading model: ${Math.round(
            (e.loaded / e.total) * 100
          )}%`;
        });
      },
    });
    console.log("LanguageModel initialized successfully");
    return model;
  } catch (error) {
    console.error("Failed to initialize LanguageModel:", error);
    customLoading.textContent = error.message;
    throw new Error(
      "Failed to initialize the language model. Please try again."
    );
  }
}

// Initialize the game
function initGame() {
  // Restore visibility of controls
  answerInput.style.display = "block";
  submitButton.style.display = "block";
  revealButton.style.display = "block";

  // Shuffle the words array for the current category
  shuffledWords = [...wordCategories[currentCategory]].sort(
    () => Math.random() - 0.5
  );
  currentWordIndex = 0;
  correctCount = 0;
  incorrectAnswers = 0;
  updateStats();
  showCurrentWord();
}

// Show the current word
function showCurrentWord() {
  const currentWord = shuffledWords[currentWordIndex];
  frenchWordElement.textContent = currentWord.french;
  wordNumberElement.textContent = `Word ${currentWordIndex + 1} of ${
    shuffledWords.length
  }`;
  answerInput.value = "";
  feedbackMessage.textContent = "";
  feedbackMessage.className = "";
  correctAnswerElement.textContent = "";
  correctAnswerElement.classList.add("hidden");
  hasShownIncorrect = false;

  // Update progress
  const progress = (currentWordIndex / shuffledWords.length) * 100;
  progressBar.style.width = `${progress}%`;
  progressText.textContent = `${currentWordIndex}/${shuffledWords.length}`;
}

// Check the answer
function checkAnswer() {
  // If we've already shown an answer (correct or incorrect), move to next word
  if (hasShownIncorrect) {
    currentWordIndex++;
    if (currentWordIndex < shuffledWords.length) {
      showCurrentWord();
    } else {
      showGameComplete();
    }
    return;
  }

  const currentWord = shuffledWords[currentWordIndex];
  const userAnswer = answerInput.value.trim().toLowerCase();
  let correctAnswer = currentWord.english.toLowerCase();

  // Remove anything in parentheses and trim
  correctAnswer = correctAnswer.replace(/\([^)]*\)/g, "").trim();

  // Split multiple correct answers by comma
  const correctAnswers = correctAnswer.split(",").map((ans) => ans.trim());

  // Check if user's answer matches any of the correct answers
  const isCorrect = correctAnswers.some((ans) => userAnswer === ans);

  if (isCorrect) {
    feedbackMessage.textContent = "Correct!";
    feedbackMessage.className = "correct";
    correctCount++;
    updateStats();

    // Show the full correct answer even when correct
    correctAnswerElement.textContent = `Correct answer: ${currentWord.english}`;
    correctAnswerElement.classList.remove("hidden");
    hasShownIncorrect = true;

    addToWordHistory(currentWord, userAnswer, true);
  } else {
    feedbackMessage.textContent = "Incorrect!";
    feedbackMessage.className = "incorrect";
    correctAnswerElement.textContent = `Correct answer: ${currentWord.english}`;
    correctAnswerElement.classList.remove("hidden");
    incorrectAnswers++;
    updateStats();
    hasShownIncorrect = true;

    addToWordHistory(currentWord, userAnswer, false);
  }
}

// Reveal the answer
function revealAnswer() {
  const currentWord = shuffledWords[currentWordIndex];
  correctAnswerElement.textContent = `Correct answer: ${currentWord.english}`;
  correctAnswerElement.classList.remove("hidden");
  incorrectAnswers++;
  updateStats();
  hasShownIncorrect = true;
}

// Update statistics
function updateStats() {
  correctCountElement.textContent = correctCount;
  incorrectCountElement.textContent = incorrectAnswers;
  const total = correctCount + incorrectAnswers;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  accuracyElement.textContent = `${accuracy}%`;
}

// Show game complete message
function showGameComplete() {
  frenchWordElement.textContent = "Game Complete!";
  wordNumberElement.textContent = "";
  answerInput.style.display = "none";
  submitButton.style.display = "none";
  revealButton.style.display = "none";
  feedbackMessage.textContent = `Final Score: ${correctCount} correct out of ${shuffledWords.length}`;
  feedbackMessage.className = "";
}

// Handle category selection
function handleCategoryChange(category) {
  currentCategory = category;
  // Update active tab
  tabButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.category === category);
  });

  // Show/hide appropriate card
  if (category === "conjugation") {
    vocabularyCard.classList.add("hidden");
    conjugationCard.classList.remove("hidden");
    customCard.classList.add("hidden");
    initConjugationPractice();
  } else if (category === "custom") {
    vocabularyCard.classList.add("hidden");
    conjugationCard.classList.add("hidden");
    customCard.classList.remove("hidden");
  } else {
    vocabularyCard.classList.remove("hidden");
    conjugationCard.classList.add("hidden");
    customCard.classList.add("hidden");
    // Reset and start new game with selected category
    shuffledWords = [...wordCategories[currentCategory]].sort(
      () => Math.random() - 0.5
    );
    currentWordIndex = 0;
    correctCount = 0;
    incorrectAnswers = 0;
    hasShownIncorrect = false;
    wordHistory = []; // Clear word history when changing categories
    updateStats();
    showCurrentWord();
  }
}

function addToWordHistory(word, userAnswer, isCorrect) {
  const historyItem = {
    word: word,
    userAnswer: userAnswer,
    isCorrect: isCorrect,
    timestamp: new Date(),
  };
  wordHistory.unshift(historyItem); // Add to beginning of array
  updateWordHistoryDisplay();
}

function updateWordHistoryDisplay() {
  const historyContainer = document.getElementById("wordHistory");
  historyContainer.innerHTML = "";

  wordHistory.forEach((item) => {
    const div = document.createElement("div");
    div.className = `word-history-item ${
      item.isCorrect ? "correct" : "incorrect"
    }`;
    div.textContent = `${item.word.french} → ${item.userAnswer} (${item.word.english})`;
    historyContainer.appendChild(div);
  });
}

function initConjugationPractice() {
  // Get random verb from conjugation data
  const verbs = Object.keys(conjugationData);
  currentConjugationVerb = verbs[Math.floor(Math.random() * verbs.length)];
  conjugationVerb.textContent = currentConjugationVerb;

  // Clear all inputs
  conjugationInputs.forEach((input) => {
    input.value = "";
    input.classList.remove("correct", "incorrect");
  });
}

function checkConjugation() {
  const conjugations = conjugationData[currentConjugationVerb][currentTense];
  let allCorrect = true;

  conjugationInputs.forEach((input) => {
    const pronoun = input.dataset.pronoun;
    const userAnswer = input.value.trim().toLowerCase();
    const correctAnswer = conjugations[pronoun].toLowerCase();

    if (userAnswer === correctAnswer) {
      input.classList.add("correct");
      input.classList.remove("incorrect");
    } else {
      input.classList.add("incorrect");
      input.classList.remove("correct");
      allCorrect = false;
    }
  });

  if (allCorrect) {
    // Get new verb after a short delay
    setTimeout(() => {
      initConjugationPractice();
    }, 1500);
  }
}

function revealConjugation() {
  const conjugations = conjugationData[currentConjugationVerb][currentTense];

  conjugationInputs.forEach((input) => {
    const pronoun = input.dataset.pronoun;
    input.value = conjugations[pronoun];
    input.classList.add("correct");
    input.classList.remove("incorrect");
  });
}

// Event listeners
submitButton.addEventListener("click", checkAnswer);
revealButton.addEventListener("click", revealAnswer);
answerInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    checkAnswer();
  }
});

// Add event listeners for category tabs
tabButtons.forEach((btn) => {
  btn.addEventListener("click", () =>
    handleCategoryChange(btn.dataset.category)
  );
});

// Event listeners for conjugation practice
tenseButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tenseButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentTense = btn.dataset.tense;
    initConjugationPractice();
  });
});

checkConjugationBtn.addEventListener("click", checkConjugation);
revealConjugationBtn.addEventListener("click", revealConjugation);

// Function to generate custom vocabulary
async function generateCustomVocabulary(category) {
  try {
    customLoading.classList.remove("hidden");
    customError.classList.add("hidden");

    const languageModel = await getLanguageModel();

    const prompt = `Generate a list of 20 French words related to "${category}". 
        For each word, provide its English translation. 
        Format the response as a JSON array of objects with 'french' and 'english' properties.
        Example format:
        [
            {"french": "la maison", "english": "house"},
            {"french": "le jardin", "english": "garden"},
            {"french": "repos", "english": "rest, relaxation"}
        ]`;

    const response = await languageModel.prompt(prompt);

    console.log(response);
    if (!response) {
      throw new Error("Failed to generate vocabulary");
    }

    // Extract JSON from the response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Failed to generate valid JSON response");
    }

    const words = JSON.parse(jsonMatch[0]);

    // Update the wordCategories with the new custom category
    wordCategories.custom = words;

    // Switch to vocabulary mode with the new words
    shuffledWords = [...words].sort(() => Math.random() - 0.5);
    currentWordIndex = 0;
    correctCount = 0;
    incorrectAnswers = 0;
    hasShownIncorrect = false;
    wordHistory = [];

    // Show vocabulary card with new words
    vocabularyCard.classList.remove("hidden");
    customCard.classList.add("hidden");
    updateStats();
    showCurrentWord();
  } catch (error) {
    console.error("Error generating vocabulary:", error);
    errorMessage.textContent = error.message;
    customError.classList.remove("hidden");
  } finally {
    customLoading.classList.add("hidden");
  }
}

// Event listener for search button
searchBtn.addEventListener("click", () => {
  const category = categoryInput.value.trim();
  if (category) {
    generateCustomVocabulary(category);
  }
});

// Event listener for Enter key in category input
categoryInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const category = categoryInput.value.trim();
    if (category) {
      generateCustomVocabulary(category);
    }
  }
});

// Start the game
initGame();
