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
function checkGuess() {

    for (let i = 0; i < COLS; i++) {

        const guessedLetter = currentGuess[i];
        const answerLetter = ANSWER[i];

        console.log(
            guessedLetter,
            answerLetter
        );
    }
}
