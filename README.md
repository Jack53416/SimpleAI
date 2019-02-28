# Simple AI

A project containing basic AI for a simple variant of capture the flag game.

The objective of a game is to capture a flag placed in the center of the map and return with it to the starting position called base. The game is turn based and allows only for certain movement points in one turn.
Each player can either utilize it to traverse through map terrain or pass the turn and lose his movement points. The game features various 
terrain tiles with different movement cost, making it harder for players to navigate.

Further rules include:
- PvP action - a player can be killed, when opposing player reaches the position occupied by first player during his turn
- Killed player respawns in his base
- Player carrying the flag has increased movement cost to allow for the killed player to catch up.


The AI utilizes A* algorithm to navigate through the map consisting of different terrain tiles, each with different movement cost. If possible it
tries to kill enemy player and carry the flag back to its starting base.
