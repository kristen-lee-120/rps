# Action Chunking using Rock Paper Scissors

## Overview
This experiment is intended to analyze how participants' performance in a game of Rock Paper Scissors varies with the policy of a computer opponent.

## Experiment
### Timeline
The experiment will proceed roughly as follows:
- Instructions will be displayed to the participant
- One practice round
- Several experimental rounds
- Thank the participant

### Task
Each task will count down "rock, paper, scissors, go" with a 1-second delay between each count. A response will be required before "go", otherwise the round will be counted as a loss. At "go", the computer's move is displayed to the user along with whether the round was counted as a win or loss. After a brief delay, the next round will automatically begin.

### I/O
- Users will make their choice using the keys ["r", "p", "s"].
- Both response time and win/loss status will be recorded
- A win will be clearly depicted with a large green circle, and a loss with a large red X.

## Implementation
The experiment will be implemented using jsPsych. Each participant will be assigned a random condition representing a particular hidden bot policy. Each bot policy is defined as a function of its own previous three moves, and is represented as a dictionary in a JSON file roughly as follows:

```json
{
  "rrr": {
    "p_r": 0.0,
    "p_p": 0.5,
    "p_s": 0.5
  },
  "rrp": {
    "p_r": 0.0,
    "p_p": 0.0,
    "p_s": 1.0
  },
```

The bot policy will be constructed using a specialized algorithm in future iterations, but for now, we will create a single dummy policy.
