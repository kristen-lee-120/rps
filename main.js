const allMoves = ["r", "p", "s"];
const keyToMove = { r: "rock", p: "paper", s: "scissors" };
const moveToLabel = { r: "Rock", p: "Paper", s: "Scissors" };
const moveImagePaths = Object.values(keyToMove).map(
    (moveName) => `images/${moveName}.png`,
);

const winPairs = new Set(["r s", "p r", "s p"]);
const moveCounters = { r: "p", p: "s", s: "r" };

const randomChoice = (moves) => moves[Math.floor(Math.random() * moves.length)];

const randomIntInclusive = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

class Policy {
    constructor(chunk = null) {
        this.phase = 0;

        if (Array.isArray(chunk) && chunk.length > 0) {
            this.chunk = [...chunk];
            this.keyMove = chunk[0];
            this.chunkLength = chunk.length;
        } else {
            this.keyMove = randomChoice(allMoves);
            this.chunkLength = randomIntInclusive(2, 5);
            const chunkMoves = allMoves.filter((move) => move !== this.keyMove);
            this.chunk = [this.keyMove];
            for (let i = 1; i < this.chunkLength; i += 1) {
                this.chunk.push(randomChoice(chunkMoves));
            }
        }
    }

    nextMove() {
        if (this.phase === 0) {
            const move = randomChoice(allMoves);
            if (move !== this.keyMove) {
                return move;
            }
        }
        const move = this.chunk[this.phase];
        this.phase = (this.phase + 1) % this.chunkLength;
        return move;
    }
}

const computeOutcome = (playerMove, botMove, respondedBeforeGo) => {
    if (!respondedBeforeGo) return "loss";
    if (!playerMove) return "loss";
    if (playerMove === botMove) return "loss";
    return winPairs.has(`${playerMove} ${botMove}`) ? "win" : "loss";
};

const buildRound = (
    jsPsych,
    policy,
    roundIndex,
    isPractice,
    onRoundResolved = null,
) => {
    let keyboardListener = null;
    const countdown = {
        type: jsPsychHtmlKeyboardResponse,
        choices: allMoves,
        stimulus:
            `
                <div class="rps-copy">
                    <p>Choose your move with <strong>R</strong>, <strong>P</strong>, or <strong>S</strong> before the timer reaches 0.</p>
                    <div id="countdown" class="rps-countdown">3</div>
                </div>
            `,
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
                if (target) target.textContent = "2";
            }, 1000);
            jsPsych.pluginAPI.setTimeout(() => {
                if (target) target.textContent = "1";
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
            const policyPhase = policy.phase;
            const botMove = policy.nextMove();
            const outcome = computeOutcome(
                playerMove,
                botMove,
                respondedBeforeGo,
            );
            data.player_move = playerMove;
            data.bot_move = botMove;
            data.policy_phase = policyPhase;
            data.outcome = outcome;
            data.responded_before_go = respondedBeforeGo;
            data.response_timeout = !respondedBeforeGo;
            if (typeof onRoundResolved === "function") {
                onRoundResolved(data);
            }
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
                    ? '<div class="rps-indicator rps-indicator-win">O</div>'
                    : '<div class="rps-indicator rps-indicator-loss">X</div>';
            const outcomeLabel = outcome === "win" ? "Win" : "Loss";
            const botLabel = botMove ? moveToLabel[botMove] : "Unknown";
            const imageName = botMove ? keyToMove[botMove] : null;
            const imageTag = imageName
                ? `<img src="images/${imageName}.png" alt="${botLabel}" class="rps-bot-image" />`
                : "";
            const timeoutTag = timedOut
                ? '<div class="rps-timeout">Too slow! No response before Go.</div>'
                : "";
            return `
                ${timeoutTag}
                <div class="rps-go">Go!</div>
                <div class="rps-bot-played">Computer played: ${botLabel}</div>
                <div class="rps-outcome">Result: ${outcomeLabel}</div>
                ${imageTag}
                ${indicator}
            `;
        },
    };

    return [countdown, feedback];
};

const startExperiment = async () => {
    const experimentalPolicy = new Policy();

    const jsPsych = initJsPsych({
        show_progress_bar: true,
        auto_update_progress_bar: false,
        message_progress_bar: "Main experiment progress",
    });

    var random_id = jsPsych.randomization.randomID(10); 1
    var filename = `${random_id}.csv`;
    jsPsych.data.addProperties({
      random_id: random_id,
    });  

    const condition = `chunk_length_${experimentalPolicy.chunkLength}`;
    jsPsych.data.addProperties({
        condition,
        chunk_length: experimentalPolicy.chunkLength,
        key_move: experimentalPolicy.keyMove,
        chunk: experimentalPolicy.chunk.join(""),
    });
    console.log(`Chunk: ${experimentalPolicy.chunk.join(", ")}`);

    const instructionsBasics = {
        type: jsPsychHtmlKeyboardResponse,
        choices: [" "],
        stimulus: `
            <div class="rps-copy">
                <p>In this task you will play Rock Paper Scissors.</p>
                <p>Use the keys <strong>R</strong>, <strong>P</strong>, and <strong>S</strong> to respond.</p>
                <p>Each round shows a countdown from <strong>3</strong> to <strong>1</strong>.</p>
                <p>You must respond before the countdown reaches <strong>0</strong>, or the round counts as a loss.</p>
                <p>As soon as you respond, the countdown ends and the result screen appears.</p>
                <p>Press the space bar to continue.</p>
            </div>
        `,
    };
    const instructionsPolicy1 = {
        type: jsPsychHtmlKeyboardResponse,
        choices: [" "],
        stimulus: `
            <div class="rps-copy">
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
            <div class="rps-copy">
                <p>The sequence will never contain the move that triggered it.</p>
                <p>For example, if <strong>rock</strong> is the trigger move, the sequence may be <strong>paper, paper.</strong></p>
                <p>Let's try some practice rounds using that sequence.</p>
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

    const practiceSequence = ["r", "p", "p"];
    const totalExperimentRounds = 100;
    let completedExperimentRounds = 0;

    let practiceRoundIndex = 0;
    let practiceComplete = false;
    let showPracticeReminder = false;
    let successfulPracticeRuns = 0;
    let pendingPracticeCounters = [];
    const practicePolicy = new Policy(practiceSequence);

    const onPracticeRoundResolved = (data) => {
        practiceRoundIndex += 1;
        data.round_index = practiceRoundIndex;
        showPracticeReminder = false;

        if (pendingPracticeCounters.length > 0) {
            const expectedCounter = pendingPracticeCounters[0];
            const predictedCorrectly =
                data.responded_before_go &&
                data.player_move === expectedCounter;

            if (predictedCorrectly) {
                pendingPracticeCounters.shift();
                if (pendingPracticeCounters.length === 0) {
                    successfulPracticeRuns += 1;
                    practiceComplete = successfulPracticeRuns >= 2;
                }
            } else {
                pendingPracticeCounters = [];
                showPracticeReminder = true;
            }
            return;
        }

        if (data.bot_move === practiceSequence[0]) {
            pendingPracticeCounters = practiceSequence
                .slice(1)
                .map((move) => moveCounters[move]);
        }
    };

    const onExperimentRoundResolved = () => {
        completedExperimentRounds += 1;
        jsPsych.progressBar.progress =
            completedExperimentRounds / totalExperimentRounds;
    };

    const practiceReminderNode = {
        timeline: [
            {
                type: jsPsychHtmlKeyboardResponse,
                choices: [" "],
                stimulus: `
                    <div class="rps-copy">
                        <p><strong>Hint:</strong> when the computer plays <strong>rock</strong>, it will continue with <strong>paper, paper</strong>.</p>
                        <p>To counter that sequence, play <strong>scissors, scissors</strong> on the next two rounds.</p>
                        <p>Press the space bar to continue practice.</p>
                    </div>
                `,
            },
        ],
        conditional_function: () => showPracticeReminder,
    };

    const practiceLoop = {
        timeline: [
            ...buildRound(
                jsPsych,
                practicePolicy,
                0,
                true,
                onPracticeRoundResolved,
            ),
            practiceReminderNode,
        ],
        loop_function: () => !practiceComplete,
    };

    const experimentRounds = [];
    for (let i = 1; i <= totalExperimentRounds; i += 1) {
        experimentRounds.push(
            ...buildRound(
                jsPsych,
                experimentalPolicy,
                i,
                false,
                onExperimentRoundResolved,
            ),
        );
    }

    const startMainProgress = {
        type: jsPsychCallFunction,
        func: () => {
            completedExperimentRounds = 0;
            jsPsych.progressBar.progress = 0;
        },
    };

    const mainPhaseIntro = {
        type: jsPsychHtmlKeyboardResponse,
        choices: [" "],
        stimulus: `
            <div class="rps-copy">
                <p>Well done! You're getting the hang of this.</p>
                <p>You'll now begin the scored rounds.</p>
                <p><strong>Pay attention:</strong> the pattern may change, and may be shorter or longer than the practice sequence.</p>
                <p>Remember, the pattern will never contain the move that triggered it.</p>
                <p>Press the space bar to begin.</p>
            </div>
        `,
    };

    const saveData = {
        type: jsPsychPipe,
        action: "save",
        experiment_id: "bJHBtUK5dUc8",
        filename: filename,
        data_string: ()=>jsPsych.data.get().csv()
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
                <div class="rps-copy">
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
        practiceLoop,
        mainPhaseIntro,
        startMainProgress,
        ...experimentRounds,
        saveData,
        thanks,
    ];

    jsPsych.run(timeline);
};

startExperiment();
