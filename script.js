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
let submittingGuess = false;


// =========================
// PLAYER IDENTITY
// =========================

let playerId = localStorage.getItem("wordshift_player_id");

if (!playerId) {
    playerId = crypto.randomUUID();
    localStorage.setItem("wordshift_player_id", playerId);
}

let playerName = localStorage.getItem("wordshift_player_name");


// =========================
// CREATE BOARD
// =========================

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


// =========================
// RESET BOARD
// =========================

function resetBoard() {

    currentGuess = "";
    currentRow = 0;
    puzzleSolved = false;
    submittingGuess = false;

    for (let row = 0; row < ROWS; row++) {

        for (let col = 0; col < COLS; col++) {

            const tile =
                board.children[row].children[col];

            tile.textContent = "";
            tile.style.backgroundColor = "";
            tile.style.color = "";
        }
    }
}


// =========================
// UPDATE CURRENT ROW
// =========================

function updateBoard() {

    const row = board.children[currentRow];

    if (!row) {
        return;
    }

    for (let col = 0; col < COLS; col++) {

        const tile = row.children[col];

        tile.textContent =
            currentGuess[col] || "";
    }
}


// =========================
// KEYBOARD INPUT
// =========================

document.addEventListener("keydown", async function(event) {

    if (puzzleSolved || submittingGuess) {
        return;
    }

    // Backspace
    if (event.key === "Backspace") {

        event.preventDefault();

        currentGuess =
            currentGuess.slice(0, -1);

        updateBoard();

        return;
    }


    // Enter
    if (event.key === "Enter") {

        if (currentGuess.length !== COLS) {
            return;
        }

        event.preventDefault();

        submittingGuess = true;

        const valid = await checkGuess();

        if (!valid) {
            submittingGuess = false;
            return;
        }

        // If the puzzle wasn't solved,
        // move to the next row.
        if (!puzzleSolved) {

            if (currentRow < ROWS - 1) {

                currentRow++;
                currentGuess = "";

                updateBoard();

            } else {

                currentGuess = "";
            }
        }

        submittingGuess = false;

        return;
    }


    // Letters
    if (/^[a-zA-Z]$/.test(event.key)) {

        if (currentGuess.length < COLS) {

            currentGuess +=
                event.key.toUpperCase();

            updateBoard();
        }
    }
});


// =========================
// CHECK GUESS
// =========================

async function checkGuess() {

    const row =
        board.children[currentRow];

    const { data, error } =
        await db.rpc(
            "check_wordshift_guess",
            {
                guess: currentGuess,
                player_id_input: playerId
            }
        );


    // Database error
    if (error) {

        console.error(
            "Guess error:",
            error
        );

        alert(
            "There was an error checking your guess."
        );

        return false;
    }


    console.log(
        "Guess result:",
        data
    );


    // Invalid word
    if (!data.valid) {

        alert("Not a valid word!");

        return false;
    }


    // =========================
    // COLOR THE TILES
    // =========================

    const result = data.result;

    for (let i = 0; i < COLS; i++) {

        const tile = row.children[i];

        if (result[i] === "R") {

            // Correct letter
            // Correct position
            tile.style.backgroundColor =
                "red";

            tile.style.color =
                "white";

        } else if (result[i] === "Y") {

            // Correct letter
            // Wrong position
            tile.style.backgroundColor =
                "#d6b800";

            tile.style.color =
                "white";

        } else {

            // Letter not in word
            tile.style.backgroundColor =
                "green";

            tile.style.color =
                "white";
        }
    }


    // =========================
    // PUZZLE SOLVED
    // =========================

    if (data.correct) {

        puzzleSolved = true;

        console.log(
            "🎉 Puzzle solved!"
        );

        console.log(
            "Puzzle ID:",
            data.puzzle_id
        );

        console.log(
            "Puzzle version:",
            data.puzzle_version
        );

        console.log(
            "Solved word:",
            data.solved_word
        );


        // =========================
        // GET PLAYER NAME
        // =========================

        if (!playerName) {

            playerName =
                prompt(
                    "You solved it! Enter your name:"
                );


            if (
                !playerName ||
                playerName.trim() === ""
            ) {

                alert(
                    "You need to enter a name to get on the leaderboard."
                );

                return true;
            }


            playerName =
                playerName.trim();


            localStorage.setItem(
                "wordshift_player_name",
                playerName
            );
        }


        // =========================
        // SAVE SCORE
        // =========================

        const {
            data: scoreData,
            error: scoreError
        } = await db.rpc(
            "submit_wordshift_score",
            {
                player_id_input:
                    playerId,

                player_name_input:
                    playerName,

                solved_word_input:
                    data.solved_word,

                puzzle_id_input:
                    data.puzzle_id,

                puzzle_version_input:
                    data.puzzle_version
            }
        );


        // Score error
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


        // =========================
        // SCORE SUCCESS
        // =========================

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


            // Update leaderboard
            loadLeaderboard();


            // The database already changed
            // the puzzle to the next word.
            //
            // We reset our local board immediately.
            resetBoard();
        }

    }

    return true;
}


// =========================
// LOAD LEADERBOARD
// =========================

async function loadLeaderboard() {

    const {
        data,
        error
    } = await db
        .from("leaderboard")
        .select("name, points")
        .order(
            "points",
            {
                ascending: false
            }
        )
        .order(
            "name",
            {
                ascending: true
            }
        )
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


    data.forEach(
        function(player, index) {

            const row =
                document.createElement(
                    "div"
                );


            row.textContent =
                (index + 1) +
                ". " +
                player.name +
                " — " +
                player.points +
                " points";


            list.appendChild(row);
        }
    );
}


// Load leaderboard immediately
loadLeaderboard();


// =========================
// REALTIME PUZZLE UPDATES
// =========================

const puzzleChannel =
    db
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


                // Don't reset while we are
                // still processing our own solve.
                if (submittingGuess) {
                    return;
                }


                resetBoard();

                loadLeaderboard();
            }
        )
        .subscribe();


// =========================
// REALTIME LEADERBOARD
// =========================

const leaderboardChannel =
    db
        .channel(
            "leaderboard-changes"
        )
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
