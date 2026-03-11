## abstract

> Chunking is a strategy for grouping units of information in memory, and is widely believed to reduce cognitive load under working memory constraints. A recent line of research attempts to formalize chunking in terms of Shannon information. Lai and others argue that an agent's policy can be modeled as a noisy communication channel (2021) in which the agent optimizes a tradeoff between fidelity and bitrate. Using a simple stimulus-response task (2025), the same authors provide evidence that chunking in humans occurs due to a rate limit on a quantity they term _conditional policy complexity_, the mutual information between state and action conditioned on a single discrete timestep of state history. We attempt to both replicate and extend this finding by producing evidence that chunking occurs in more complex scenarios due to a constraint on policy complexity conditioned on _multiple_ previous timesteps.

## intro/background
- mention miller's landmark paper, "the magical number seven, plus or minus two"
- reaction time in the sequential condition of the serial reaction time task (SRTT) is lower (Dezfouli, 2012)
- policy complexity $I(S;A)$ is first proposed as a way to model suboptimal learning in schizophrenic patients (Lai and others, 2021)
- conditional policy complexity $I(S_t;A|S_{t-1})$ models the trend of higher accuracy and lower RT in a variant of the SRTT (Lai and others, 2025)

## task and motivations
- overview of RPS task:
    > Our task consisted of 100 rounds of Rock Paper Scissors against a computer opponent which plays according to a randomly assigned hidden policy. The policy is defined by the chunk length L and key move K such that the bot chooses random moves with uniform probability until it plays K, at which point it begins a deterministic sequence of L moves. After finishing the chunk sequence, it returns to random play.
    >
    > In order to distinguish between fully random rounds and rounds for which the user may be expected to anticipate the bot’s action, we assign each move an integer _policy phase_ φ such that for randomly chosen moves the round is designated with φ = 0, and for chunked moves that follow K, φ is in {1, … L - 1}.
- we define the policy complexity for the computer opponent in our game of Rock, Paper, Scissors as $I(M_t;M_{t+1})$ where $M_t \in [\text{Rock}, \text{Paper}, \text{Scissors}]$ is the move chosen at timestep $t$
- in order to fully predict the opponent's subsequent move, the player needs to condition on the key move, because it signals the policy phase
- crucially, our four hidden policy conditions are stratified by full-history conditional policy complexity $I(M_t;M_{t+1}|M_0 \ldots M_{t-1})$, whereas single-stage conditional policy complexity $I(M_t;M_{t+1}|M_{t-1})$ is insufficient to distinguish our conditions (see `paper/plots/cpc.png`).
- therefore, any systematic differences in accuracy or RT point to multi-stage conditional policy complexity as the independent variable