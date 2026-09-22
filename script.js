const SUPABASE_URL = "https://lkcthtrseqstnrvijijv.supabase.co";
const SUPABASE_KEY = "sb_publishable_BedJB-132V5jgbiu493sEQ_l0PBqTs7";

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const board = document.getElementById("game-board");

const ROWS = 10;
const COLS = 5;

let currentGuess = "";
let currentRow = 0;
let puzzleSolved = false;

// -------------------------
// Player identity
// -------------------------

let playerId = localStorage.getItem("wordshift_player_id");

if (!playerId) {
    playerId = crypto.randomUUID();
    localStorage.setItem("wordshift_player_id", playerId);
}

let playerName = localStorage.getItem("wordshift_player_name");

// -------------------------
// Create game board
// -------------------------

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

// -------------------------
// Keyboard input
// -------------------------

document.addEventListener("keydown", async function(event) {

    // Backspace
    if (event.key === "Backspace") {

        event.preventDefault();

        if (!puzzleSolved) {
            currentGuess = currentGuess.slice(0, -1);
            updateBoard();
        }

        return;
    }

    // Enter
    if (event.key === "Enter") {

        if (
            currentGuess.length === COLS &&
            !puzzleSolved
        ) {

            console.log("Guess submitted:", currentGuess);

            const valid = await checkGuess();

            if (!valid) {
                return;
            }

            // Don't move to another row if the puzzle was solved.
            if (!puzzleSolved && currentRow < ROWS - 1) {
                currentRow++;
                currentGuess = "";
                updateBoard();
            }
        }

        return;
    }

    // Letters
    if (/^[a-zA-Z]$/.test(event.key)) {

        if (
            currentGuess.length < COLS &&
            !puzzleSolved
        ) {

            currentGuess += event.key.toUpperCase();
            updateBoard();
        }
    }
});

// -------------------------
// Update board
// -------------------------

function updateBoard() {

    const row = board.children[currentRow];

    for (let col = 0; col < COLS; col++) {

        const tile = row.children[col];

        tile.textContent = currentGuess[col] || "";
    }
}

// -------------------------
// Check guess
// -------------------------

async function checkGuess() {

    const row = board.children[currentRow];

    const { data, error } = await db.rpc(
        "check_wordshift_guess",
        {
            guess: currentGuess,
            player_id_input: playerId
        }
    );

    if (error) {

        console.error("Guess error:", error);

        alert("There was an error checking your guess.");

        return false;
    }

    console.log("Guess result:", data);

    // Invalid word
    if (!data.valid) {

        alert("Not a valid word!");

        return false;
    }

    // -------------------------
    // Display result
    // -------------------------

    const result = data.result;

    for (let i = 0; i < COLS; i++) {

        const tile = row.children[i];

        if (result[i] === "R") {

            // Correct letter, correct position
            tile.style.backgroundColor = "red";
            tile.style.color = "white";

        } else if (result[i] === "Y") {

            // Correct letter, wrong position
            tile.style.backgroundColor = "#d6b800";
            tile.style.color = "white";

        } else {

            // Letter isn't in the word
            tile.style.backgroundColor = "green";
            tile.style.color = "white";
        }
    }

    // -------------------------
    // Puzzle solved
    // -------------------------

    if (data.correct) {

        puzzleSolved = true;

        console.log("🎉 Puzzle solved!");
        console.log("Solved puzzle ID:", data.puzzle_id);
        console.log("Solved word:", data.solved_word);

        // Ask for name if we don't already have one
        if (!playerName) {

            playerName = prompt(
                "You solved it! Enter your name:"
            );

            if (!playerName || playerName.trim() === "") {

                alert(
                    "You need to enter a name to get on the leaderboard."
                );

                return true;
            }

            playerName = playerName.trim();

            localStorage.setItem(
                "wordshift_player_name",
                playerName
            );
        }

        // -------------------------
        // Give the player a point
        // -------------------------

        const {
            data: scoreData,
            error: scoreError
        } = await db.rpc(
            "submit_wordshift_score",
            {
                player_id_input: playerId,
                player_name_input: playerName,
                solved_word_input: data.solved_word,
                puzzle_id_input: data.puzzle_id
            }
        );

        if (scoreError) {

            console.error(
                "Score error:",
                scoreError
            );

            alert(
                "Your score couldn't be saved."
            );

            return true;
        }

        console.log(
            "Score result:",
            scoreData
        );

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

            // Refresh leaderboard immediately
            loadLeaderboard();
        }
    }

    return true;
}

// -------------------------
// Load leaderboard
// -------------------------

async function loadLeaderboard() {

    const {
        data,
        error
    } = await db
        .from("leaderboard")
        .select("name, points")
        .order("points", {
            ascending: false
        })
        .order("name", {
            ascending: true
        })
        .limit(50);

    if (error) {

        console.error(
            "Leaderboard error:",
            error
        );

        return;
    }

    const list =
        document.getElementById(
            "leaderboard-list"
        );

    if (!list) {
        return;
    }

    list.innerHTML = "";

    data.forEach(function(player, index) {

        const row =
            document.createElement("div");

        row.textContent =
            (index + 1) +
            ". " +
            player.name +
            " — " +
            player.points +
            " points";

        list.appendChild(row);
    });
}

// Load leaderboard when the page starts
loadLeaderboard();

// -------------------------
// Realtime puzzle updates
// -------------------------

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

            console.log(
                "Puzzle changed!",
                payload
            );

            // Reset the board
            for (
                let row = 0;
                row < ROWS;
                row++
            ) {

                for (
                    let col = 0;
                    col < COLS;
                    col++
                ) {

                    const tile =
                        board
                            .children[row]
                            .children[col];

                    tile.textContent = "";

                    tile.style.backgroundColor = "";

                    tile.style.color = "";
                }
            }

            currentGuess = "";
            currentRow = 0;
            puzzleSolved = false;

            updateBoard();

            // Refresh leaderboard too
            loadLeaderboard();
        }
    )
    .subscribe();

// -------------------------
// Realtime leaderboard updates
// -------------------------

const leaderboardChannel = db
    .channel("leaderboard-changes")
    .on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table: "leaderboard"
        },
        function(payload) {

            console.log(
                "Leaderboard changed!",
                payload
            );

            loadLeaderboard();
        }
    )
    .subscribe();
