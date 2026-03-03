const allMoves = ["r", "p", "s"];
const keyToMove = { r: "rock", p: "paper", s: "scissors" };
const moveToLabel = { r: "Rock", p: "Paper", s: "Scissors" };
const moveImagePaths = Object.values(keyToMove).map(
    (moveName) => `images/${moveName}.png`,
);

const winPairs = new Set(["r s", "p r", "s p"]);

const randomChoice = (moves) => moves[Math.floor(Math.random() * moves.length)];

const randomIntInclusive = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

const buildChunkPolicy = () => {
    const keyMove = randomChoice(allMoves);
    const chunkLength = randomIntInclusive(2, 5);
    const chunkMoves = allMoves.filter((move) => move !== keyMove);
    const chunk = [keyMove];
    for (let i = 1; i < chunkLength; i += 1) {
        chunk.push(randomChoice(chunkMoves));
    }
    let phase = 0;
    const nextMove = () => {
        if (phase === 0) {
            const move = randomChoice(allMoves);
            if (move !== keyMove) {
                return move;
            }
        }
        const move = chunk[phase];
        phase = (phase + 1) % chunkLength;
        return move;
    };
    return { keyMove, chunkLength, chunk, nextMove };
};

const computeOutcome = (playerMove, botMove, respondedBeforeGo) => {
    if (!respondedBeforeGo) return "loss";
    if (!playerMove) return "loss";
    if (playerMove === botMove) return "loss";
    return winPairs.has(`${playerMove} ${botMove}`) ? "win" : "loss";
};

const buildRound = (jsPsych, policy, roundIndex, isPractice) => {
    let keyboardListener = null;
    const countdown = {
        type: jsPsychHtmlKeyboardResponse,
        choices: allMoves,
        stimulus:
            '<div style="text-align:center;"><div id="countdown" style="font-size:64px;font-weight:600;">Rock...</div></div>',
        trial_duration: 3000,
        response_ends_trial: true,
        data: {
            task_phase: "rps",
            round_index: roundIndex,
            practice: isPractice,
        },
        on_load: () => {
            const display = jsPsych.getDisplayElement();
            const target = display.querySelector("#countdown");
            jsPsych.pluginAPI.setTimeout(() => {
                if (target) target.textContent = "Paper...";
            }, 1000);
            jsPsych.pluginAPI.setTimeout(() => {
                if (target) target.textContent = "Scissors...";
            }, 2000);
        },
        on_finish: (data) => {
            const respondedBeforeGo = data.rt !== null && data.rt < 3000;
            const responseKey = data.response
                ? data.response.toLowerCase()
                : null;
            const playerMove =
                respondedBeforeGo && responseKey && keyToMove[responseKey]
                    ? responseKey
                    : null;
            const botMove = policy.nextMove();
            const outcome = computeOutcome(
                playerMove,
                botMove,
                respondedBeforeGo,
            );
            data.player_move = playerMove;
            data.bot_move = botMove;
            data.outcome = outcome;
            data.responded_before_go = respondedBeforeGo;
            data.response_timeout = !respondedBeforeGo;
        },
    };

    const feedback = {
        type: jsPsychHtmlKeyboardResponse,
        choices: "NO_KEYS",
        trial_duration: 1500,
        data: {
            task_phase: "feedback",
            round_index: roundIndex,
            practice: isPractice,
        },
        stimulus: () => {
            const last = jsPsych.data.get().last(1).values()[0];
            const botMove = last.bot_move;
            const outcome = last.outcome;
            const timedOut = last.response_timeout;
            const indicator =
                outcome === "win"
                    ? '<div style="font-size:80px;color:#22c55e;font-weight:700;">O</div>'
                    : '<div style="font-size:80px;color:#ef4444;font-weight:700;">X</div>';
            const botLabel = botMove ? moveToLabel[botMove] : "Unknown";
            const imageName = botMove ? keyToMove[botMove] : null;
            const imageTag = imageName
                ? `<img src="images/${imageName}.png" alt="${botLabel}" style="width:240px;height:auto;margin:12px auto 24px;display:block;" />`
                : "";
            const timeoutTag = timedOut
                ? '<div style="font-size:28px;color:#ef4444;margin-bottom:20px;">Too slow! No response before Go.</div>'
                : "";
            return `
                ${timeoutTag}
                <div style="font-size:48px;font-weight:600;margin-bottom:20px;">Go!</div>
                <div style="font-size:32px;margin-bottom:12px;">Computer played: ${botLabel}</div>
                ${imageTag}
                ${indicator}
            `;
        },
    };

    return [countdown, feedback];
};

const startExperiment = async () => {
    const policy = buildChunkPolicy();

    const jsPsych = initJsPsych();

    const condition = `chunk_length_${policy.chunkLength}`;
    jsPsych.data.addProperties({
        condition,
        chunk_length: policy.chunkLength,
        key_move: policy.keyMove,
        chunk: policy.chunk.join(""),
    });
    console.log(`Chunk: ${policy.chunk.join(", ")}`);

    const instructionsBasics = {
        type: jsPsychHtmlKeyboardResponse,
        choices: [" "],
        stimulus: `
            <div style="font-size:28px;line-height:1.4;">
                <p>In this task you will play Rock Paper Scissors.</p>
                <p>Use the keys <strong>R</strong>, <strong>P</strong>, and <strong>S</strong> to respond.</p>
                <p>The game will count down: rock, paper, scissors.</p>
                <p>You must respond before "Go!" or the round will count as a loss.</p>
                <p>Press the space bar to continue.</p>
            </div>
        `,
    };
    const instructionsPolicy1 = {
        type: jsPsychHtmlKeyboardResponse,
        choices: [" "],
        stimulus: `
            <div style="font-size:28px;line-height:1.4;">
                <p>The computer does not play completely randomly.</p>
                <p>When the computer plays <strong>one</strong> of the three moves, it will trigger a <strong>short sequence</strong>.</p>
                <p>If you spot the pattern, you can use it to your advantage!</p>
                <p>Press the space bar to continue.</p>
            </div>
        `,
    };
    const instructionsPolicy2 = {
        type: jsPsychHtmlKeyboardResponse,
        choices: [" "],
        stimulus: `
            <div style="font-size:28px;line-height:1.4;">
                <p>The sequence will never contain the move that triggered it.</p>
                <p>For example, if <strong>rock</strong> is the trigger move, the sequence may be <strong>rock, paper, paper.</strong></p>
                <p>Press the space bar to continue.</p>
            </div>
        `,
    };
    const preloadMoveImages = {
        type: jsPsychPreload,
        images: moveImagePaths,
        show_progress_bar: false,
        message: "<p>Loading game assets...</p>",
    };

    const totalPracticeRounds = 5;
    const totalExperimentRounds = 100;

    const practicePhaseIntro = {
        type: jsPsychHtmlKeyboardResponse,
        choices: [" "],
        stimulus: `
            <div style="font-size:28px;line-height:1.4;">
                <p><strong>Practice Phase</strong></p>
                <p>You will now complete ${totalPracticeRounds} practice rounds.</p>
                <p>Use this time to get used to the timing and key responses.</p>
                <p>Press the space bar to start practice.</p>
            </div>
        `,
    };

    const practiceRounds = [];
    for (let i = 1; i <= totalPracticeRounds; i += 1) {
        practiceRounds.push(...buildRound(jsPsych, policy, i, true));
    }

    const experimentRounds = [];
    for (let i = 1; i <= totalExperimentRounds; i += 1) {
        experimentRounds.push(...buildRound(jsPsych, policy, i, false));
    }

    const mainPhaseIntro = {
        type: jsPsychHtmlKeyboardResponse,
        choices: [" "],
        stimulus: `
            <div style="font-size:28px;line-height:1.4;">
                <p><strong>Main Experiment Phase</strong></p>
                <p>Practice is complete.</p>
                <p>You will now complete ${totalExperimentRounds} scored rounds.</p>
                <p>Press the space bar to begin the main experiment.</p>
            </div>
        `,
    };

    const thanks = {
        type: jsPsychHtmlKeyboardResponse,
        choices: [" "],
        stimulus: () => {
            const trials = jsPsych.data
                .get()
                .filterCustom(
                    (trial) =>
                        trial.task_phase === "rps" && trial.practice === false,
                );
            const total = trials.count();
            const wins = trials.filter({ outcome: "win" }).count();
            const accuracy = total > 0 ? Math.round((wins / total) * 100) : 0;
            return `
                <div style="font-size:28px;line-height:1.4;">
                    <p>Thanks for participating!</p>
                    <p>Your accuracy: <strong>${accuracy}%</strong></p>
                    <p>This experiment was designed to measure the effect of <a href="https://en.wikipedia.org/wiki/Chunking_(psychology)">chunking</a> on performance in a simple computer game.</p>
                    <p>Press the space bar to finish.</p>
                </div>
            `;
        },
    };

    const timeline = [
        preloadMoveImages,
        instructionsBasics,
        instructionsPolicy1,
        instructionsPolicy2,
        practicePhaseIntro,
        ...practiceRounds,
        mainPhaseIntro,
        ...experimentRounds,
        thanks,
    ];

    jsPsych.run(timeline);
};

startExperiment();
