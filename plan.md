# Action Chunking using Rock Paper Scissors

## Overview
This experiment is intended to analyze how participants' performance in a game of Rock Paper Scissors varies with the policy of a computer opponent.

## Experiment
### Timeline
The experiment will proceed as follows:
- Instructions will be displayed to the participant
- One practice round
- T experimental rounds
- Thank the participant and briefly describe the experiment.

### Task
The main task is to play Rock Paper Scissors against a computer opponent which plays according to a randomly assigned hidden policy. The policy is defined by the _chunk length_ and _key move_ such that the bot chooses random moves with uniform probability until it plays the key move, at which point it begins a deterministic sequence of _chunk length_ moves. After finishing the chunk sequence, it returns to random play.

The policy is defined in pseudocode as follows:
```psuedocode
all_moves = ["r", "p", "s"]
key_move = random_sample(all_moves)
chunk_length = random_int_inclusive(2, 5)
chunk_moves = [move for move in all_moves if move != key_move]
chunk = [key_move, ...random_sample(chunk_moves, chunk_length - 1)]
phase = 0

function next_move():
  if phase == 0:
    move = random_sample(all_moves)
    if move != key_move:
      return move
  else:
    move = chunk_moves[phase]
  phase++
  phase = phase % chunk_length  
  return move
```

The experiment will be conducted using a between-subjects paradigm, in which each subject is assigned a chunk length between 2 and 5 inclusive.

### I/O
- Each trial will count down from 3. A response will be required before the countdown reaches 0, otherwise the round will be counted as a loss.
- Users will make their choice using the keys ["r", "p", "s"]. After a response, the countdown is interrupted and the experiment jumps to the result screen.
- The result screen will display the computer's move, whether the round was counted as a win or loss, and optionally a notice that the user failed to respond in time. After a brief delay, the next round will automatically begin.
- Both response time and win/loss status will be recorded.
- A win will be clearly depicted with a large green circle, and a loss with a large red X.
- A loss due to response timeout will be reported to the user.
- At the end of the experiment, display:
    - the user's accuracy as a percentage
    - the intent of the experiment to measure their capacity to chunk action sequences

## Implementation
The experiment will be implemented using jsPsych.

### TODO:
- Ending the countdown early might be confusing for users. Instead, consider allowing the countdown to continue, but be sure to give visual feedback when the user selects a move.