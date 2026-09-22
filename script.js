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

// Get the player's saved ID
let playerId = localStorage.getItem("wordshift_player_id");

// If they don't have one, create one
if (!playerId) {
    playerId = crypto.randomUUID();

    localStorage.setItem(
        "wordshift_player_id",
        playerId
    );
}


// Get the player's saved name
let playerName = localStorage.getItem("wordshift_player_name");


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
document.addEventListener("keydown", async function(event) {

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

            const valid = await checkGuess();

            // Invalid word: stay on the same row
            if (!valid) {
                return;
            }

            // Valid word: move to the next row
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

        return false;
    }


    console.log("Guess result:", data);


    // Check if the word exists in our word list
    if (!data.valid) {

        console.log("Not a valid word!");

        alert("Not a valid word!");

        return false;
    }


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

    // Ask for the player's name if we don't know it yet
    if (!playerName) {

        playerName = prompt("You solved it! Enter your name:");

        // Don't allow an empty name
        if (!playerName || playerName.trim() === "") {
            alert("You need to enter a name to get on the leaderboard.");
            return true;
        }

        playerName = playerName.trim();

        // Remember the name
        localStorage.setItem(
            "wordshift_player_name",
            playerName
        );
    }


    // Give the player one point
    const { data: scoreData, error: scoreError } = await db.rpc(
        "submit_wordshift_score",
        {
            player_id_input: playerId,
            player_name_input: playerName,
            solved_word: currentGuess
        }
    );


    if (scoreError) {

        console.error("Score error:", scoreError);
        alert("Your score couldn't be saved.");

        return true;
    }


    console.log("Score result:", scoreData);


    if (scoreData.success) {

        if (scoreData.new_point) {

            alert(
                "🎉 You solved it!\n\n" +
                "+1 point\n" +
                "Your score: " +
                scoreData.points
            );

        } else {

            alert(
                "You already solved this puzzle!\n\n" +
                "Your score: " +
                scoreData.points
            );
        }
    }
}

    // Tell the keyboard handler that this was a valid guess
    return true;
}


// Listen for a new puzzle
const puzzleChannel = db
    .channel("puzzle-changes")
    .on(
        "postgres_changes",
        {
            event: "UPDATE",
            schema: "public",
            table: "puzzles"
        },
        function(payload) {

            console.log("Puzzle changed!", payload);


            // Clear the board
            for (let row = 0; row < ROWS; row++) {

                for (let col = 0; col < COLS; col++) {

                    const tile = board.children[row].children[col];

                    tile.textContent = "";
                    tile.style.backgroundColor = "";
                    tile.style.color = "";
                }
            }


            // Start the new puzzle from the first row
            currentGuess = "";
            currentRow = 0;

        }
    )
    .subscribe();
async function loadLeaderboard() {
    const { data, error } = await db
        .from("leaderboard")
        .select("name, points")
        .order("points", { ascending: false })
        .order("name", { ascending: true })
        .limit(50);

    if (error) {
        console.error("Leaderboard error:", error);
        return;
    }

    const list = document.getElementById("leaderboard-list");

    list.innerHTML = "";

    data.forEach(function(player, index) {
        const row = document.createElement("div");

        row.textContent =
            (index + 1) + ". " +
            player.name +
            " — " +
            player.points +
            " points";

        list.appendChild(row);
    });
}

loadLeaderboard();
