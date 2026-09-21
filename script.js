const board = document.getElementById("game-board");

const ROWS = 10;
const COLS = 5;

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

    const key = event.key.toUpperCase();

    // If it's a letter
    if (key >= "A" && key <= "Z") {

        if (currentGuess.length < COLS) {
            currentGuess += key;
            updateBoard();
        }
    }

    // Backspace
  else if (event.key === "Backspace") {

    currentGuess = currentGuess.slice(0, -1);
    updateBoard();
}
    // Enter
    else if (event.key === "Enter") {

        if (currentGuess.length === COLS) {
            console.log("Guess submitted:", currentGuess);
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
