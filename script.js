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
async function checkGuess() {

    const row = board.children[currentRow];

    // Send the guess to Supabase
    const { data, error } = await db.rpc(
        "check_wordshift_guess",
        {
            guess: currentGuess
        }
    );

    // Check for an error
    if (error) {
        console.error("Guess error:", error);
        return;
    }

    console.log("Guess result:", data);

    // Get the result from Supabase
    const result = data.result;

    // Color each tile
    for (let i = 0; i < COLS; i++) {

        const tile = row.children[i];

        if (result[i] === "R") {

            // Correct letter, correct position
            tile.style.backgroundColor = "red";
            tile.style.color = "white";

        } else if (result[i] === "Y") {

            // Letter exists, wrong position
            tile.style.backgroundColor = "#d6b800";
            tile.style.color = "white";

        } else {

            // Letter isn't in the answer
            tile.style.backgroundColor = "green";
            tile.style.color = "white";
        }
    }

    // Check if the player solved it
    if (data.correct) {
        console.log("🎉 Puzzle solved!");
    }
}
