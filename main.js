const choices = ["r", "p", "s"];
const keyToMove = { r: "rock", p: "paper", s: "scissors" };
const moveToLabel = { r: "Rock", p: "Paper", s: "Scissors" };

const winPairs = new Set(["r s", "p r", "s p"]);

const randomChoice = () => choices[Math.floor(Math.random() * choices.length)];

const sampleFromPolicy = (policyEntry) => {
    const r = Math.random();
    const pR = policyEntry.p_r ?? 0;
    const pP = policyEntry.p_p ?? 0;
    if (r < pR) return "r";
    if (r < pR + pP) return "p";
    return "s";
};

const computeOutcome = (playerMove, botMove) => {
    if (!playerMove) return "loss";
    if (playerMove === botMove) return "loss";
    return winPairs.has(`${playerMove} ${botMove}`) ? "win" : "loss";
};

const buildRound = (jsPsych, policy, botHistory, roundIndex, isPractice) => {
    let keyboardListener = null;
    const countdown = {
        type: jsPsychHtmlKeyboardResponse,
        choices,
        stimulus:
            '<div style="text-align:center;"><div id="countdown" style="font-size:64px;font-weight:600;">Rock</div></div>',
        trial_duration: 3000,
        response_ends_trial: false,
        data: {
            trial_type: "rps",
            round_index: roundIndex,
            practice: isPractice,
        },
        on_load: () => {
            const display = jsPsych.getDisplayElement();
            const target = display.querySelector("#countdown");
            jsPsych.pluginAPI.setTimeout(() => {
                if (target) target.textContent = "Paper";
            }, 1000);
            jsPsych.pluginAPI.setTimeout(() => {
                if (target) target.textContent = "Scissors";
            }, 2000);
        },
        on_finish: (data) => {
            const responseKey = data.response
                ? data.response.toLowerCase()
                : null;
            const playerMove =
                responseKey && keyToMove[responseKey] ? responseKey : null;
            let botMove = randomChoice();
            if (botHistory.length >= 3) {
                const key = botHistory.slice(-3).join("");
                const policyEntry = policy[key];
                if (policyEntry) {
                    botMove = sampleFromPolicy(policyEntry);
                }
            }
            botHistory.push(botMove);
            const outcome = computeOutcome(playerMove, botMove);
            data.player_move = playerMove;
            data.bot_move = botMove;
            data.outcome = outcome;
            data.responded_before_go = data.rt !== null;
        },
    };

    const feedback = {
        type: jsPsychHtmlKeyboardResponse,
        choices: "NO_KEYS",
        trial_duration: 1200,
        data: {
            trial_type: "feedback",
            round_index: roundIndex,
            practice: isPractice,
        },
        stimulus: () => {
            const last = jsPsych.data.get().last(1).values()[0];
            const botMove = last.bot_move;
            const outcome = last.outcome;
            const indicator =
                outcome === "win"
                    ? '<div style="font-size:72px;color:#22c55e;font-weight:700;">O</div>'
                    : '<div style="font-size:72px;color:#ef4444;font-weight:700;">X</div>';
            const botLabel = botMove ? moveToLabel[botMove] : "Unknown";
            const imageName = botMove ? keyToMove[botMove] : null;
            const imageTag = imageName
                ? `<img src="images/${imageName}.jpeg" alt="${botLabel}" style="width:240px;height:auto;margin:12px auto 24px;display:block;" />`
                : "";
            return `
                <div style="font-size:48px;font-weight:600;margin-bottom:12px;">Go!</div>
                <div style="font-size:32px;margin-bottom:12px;">Computer played: ${botLabel}</div>
                ${imageTag}
                ${indicator}
            `;
        },
    };

    return [countdown, feedback];
};

const startExperiment = async () => {
    const policy = window.dummyPolicy;

    const jsPsych = initJsPsych();

    const botHistory = [];

    const condition = "dummy_policy";
    jsPsych.data.addProperties({ condition });

    const instructions = {
        type: jsPsychHtmlKeyboardResponse,
        choices: [" "],
        stimulus: `
            <div style="font-size:28px;line-height:1.4;">
                <p>In this task you will play Rock Paper Scissors.</p>
                <p>Use the keys <strong>R</strong>, <strong>P</strong>, and <strong>S</strong> to respond.</p>
                <p>The game will count down: rock, paper, scissors.</p>
                <p>You must respond before "Go!" or the round will count as a loss.</p>
                <p>Press the space bar to begin.</p>
            </div>
        `,
    };

    const practiceRounds = buildRound(jsPsych, policy, botHistory, 0, true);

    const totalRounds = 5;
    const experimentRounds = [];
    for (let i = 1; i <= totalRounds; i += 1) {
        experimentRounds.push(
            ...buildRound(jsPsych, policy, botHistory, i, false),
        );
    }

    const thanks = {
        type: jsPsychHtmlKeyboardResponse,
        choices: [" "],
        stimulus: `
            <div style="font-size:28px;">
                <p>Thanks for participating!</p>
                <p>Press the space bar to finish.</p>
            </div>
        `,
    };

    const timeline = [
        instructions,
        ...practiceRounds,
        ...experimentRounds,
        thanks,
    ];

    jsPsych.run(timeline);
};

startExperiment();
