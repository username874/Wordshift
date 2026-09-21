const SUPABASE_URL = "https://lkcthtrseqstnrvijijv.supabase.co";
const SUPABASE_KEY = "sb_publishable_BedJB-132V5jgbiu493sEQ_l0PBqTs7";

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);



const board = document.getElementById("game-board");

const ROWS = 10;
const COLS = 5;
const ANSWER = "APPLE";

let currentGuess = "";
let currentRow = 0;


// Create the game board
for (let row = 0; row < ROWS; row++) {

    const rowElement = document.createElement("div");
    rowElement.classList.add("row");

    for (let col = 0; col < COLS; col++) {

        const tile = document.createElement("div");
        tile.classList.add("tile");

        rowElement.appendChild(tile);
    }

    board.appendChild(rowElement);
}


// Listen for keyboard presses
document.addEventListener("keydown", function(event) {

    // Backspace
    if (event.key === "Backspace") {

        event.preventDefault();

        currentGuess = currentGuess.slice(0, -1);
        updateBoard();

        return;
    }


    // Enter
    if (event.key === "Enter") {

        if (currentGuess.length === COLS) {

            console.log("Guess submitted:", currentGuess);

            checkGuess();

            if (currentRow < ROWS - 1) {
                currentRow++;
                currentGuess = "";
            }
        }

        return;
    }


    // Letters only
    if (/^[a-zA-Z]$/.test(event.key)) {

        if (currentGuess.length < COLS) {

            currentGuess += event.key.toUpperCase();
            updateBoard();
        }
    }
});


// Update the tiles
function updateBoard() {

    const row = board.children[currentRow];

    for (let col = 0; col < COLS; col++) {

        const tile = row.children[col];

        tile.textContent = currentGuess[col] || "";
    }
}


// Check the guess
function checkGuess() {

    const row = board.children[currentRow];

    // Keep track of letters still available in the answer
    let remainingLetters = ANSWER.split("");

    // First pass: check correct letters
    for (let i = 0; i < COLS; i++) {

        const guessedLetter = currentGuess[i];
        const answerLetter = ANSWER[i];

        const tile = row.children[i];

        if (guessedLetter === answerLetter) {

            tile.style.backgroundColor = "red";
            tile.style.color = "white";

            // Remove this letter from the available letters
            remainingLetters[i] = null;
        }
    }


    // Second pass: check yellow and green
    for (let i = 0; i < COLS; i++) {

        const guessedLetter = currentGuess[i];
        const tile = row.children[i];

        // Skip letters that were already red
        if (guessedLetter === ANSWER[i]) {
            continue;
        }

        const letterIndex = remainingLetters.indexOf(guessedLetter);

        if (letterIndex !== -1) {

            tile.style.backgroundColor = "#d6b800";
            tile.style.color = "white";

            // Use up this occurrence of the letter
            remainingLetters[letterIndex] = null;

        } else {

            tile.style.backgroundColor = "green";
            tile.style.color = "white";
        }
    }
}


// Test the Supabase connection
async function test() {

 const { data, error } = await db
        .from("puzzles")
        .select("word")
        .eq("id", 1)
        .single();

    if (error) {

        console.error("Supabase error:", error);
        return;
    }

    console.log("Word from Supabase:", data.word);
}

test();
