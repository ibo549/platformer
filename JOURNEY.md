# The Journey

Chibi Runner was built in a couple of hours one weekend. Halil, his daughter,
and Claude, all in one go. As we went, a new rule or a new enemy kept showing
up: written on a napkin, drawn in crayon, or declared out loud and then
defended against all counter-proposals. What follows is the game told as
feature histories. Each one, where it came from, and the tiny bit of code that
made it so.

## The cast

Three playable characters, each named after someone real:

- **Halil** — the dad. Runs in blue. Mickey tags along.
- **Lara** — his daughter. Runs in red and pink. Minnie tags along.
- **Karolcia** — a family friend. Her sprite faces left in the source art,
  so the engine flips her with a `mirror: true` flag. Scooby tags along.

Each character gets their own companion and their own color theme for the
shield power-up and the shield-pickup coin. None of the character-picking
branches are hardcoded anymore — everything reads from one table (in
`src/04-characters.js`), which means adding a new friend is one block of
config. Originally the character-specific behavior was spread across six
different branches. That was the first thing to clean up.

## The rules of this world (and how they got there)

### The poops are supposed to jump

The brown ground enemies are shaped like little cartoon poops. The
simplest thing a ground enemy can do is patrol left and right between two
points. But her poops don't — they *hop*. Every few seconds, a random one
launches itself off the ground:

```js
d.vy = 8 + Math.random() * 4;
d.onGround = false;
d.jumpCooldown = 2 + Math.random() * 4;
```

The hop height, the cooldown, the randomness of which poop jumps when —
all of that is tuning you only do if it was important to someone that
poops jump.

### The strawberries shout GAW GAW

Strawberry enemies taunt the player when they get close. The taunt is
"GAW GAW GAW GAW GAW," synthesized through `window.speechSynthesis` with
pitch cranked to 1.8 and rate to 1.6. Five GAWs. Not four, not six. The
count didn't emerge from code — it was declared, probably while
giggling, and whoever was typing typed out five.

### The sticks chant KOLA KOLA KOLA KOLA

The tall stick enemies don't shout — they chant. "KOLA KOLA KOLA KOLA"
in a low pitch, followed by a tiny high-pitched "kola kola" squeak 400ms
later. Two voices per call. They're not real words. They're a thing a
child decided sticks would say, and so sticks say it.

Sticks also take two stomps to kill. First stomp doesn't kill them — it
*deflates* them. They shrink vertically, spread horizontally, and keep
walking. Deflation is funnier than death, so deflation stays.

### The puddles melt enemies (but only on the second try)

There are water puddles scattered through the level. The player splashes
through them — bandpass-filtered noise burst, four descending tone
droplets, tiny trailing bubble. Fine. Normal.

What isn't normal is what happens to enemies that walk through puddles.
First encounter: five small water droplets start orbiting the enemy's
head, and the whole body picks up a blue tint. The enemy keeps walking.
It's just damp. Second encounter with *any* puddle: it stops dead,
shrinks to nothing over five seconds, turns full blue, and cries "oh my
god-tow."

"Oh my god-tow" is what a child says when they mean "oh my God, ow."
It's not code-generated. Someone said it out loud, pronounced exactly
like that, and then someone else put it into a speech synthesizer so the
enemy would cry it on the way out.

The two-encounter rule exists because one-shot melts made the level
trivial. Two encounters means puddles become strategy: you have to
remember which enemies are already wet.

### The pterodactyl is the reward for picking Hard

Easy: only brown poops. Normal: poops + sticks + strawberries. Hard:
all of the above *plus* a flying dinosaur.

The pterodactyl is overbuilt on purpose. Purple body, mauve belly,
bright orange beak, fiery crest, glowing yellow eyes, indigo membrane
wings with finger-bones, a tail with a diamond tip. It sine-wave bobs
up and down while patrolling. It flaps its wings through a separate
pivot group. It shoots flames. It screeches "SKREEEE!" when the player
is close.

First stomp doesn't kill it — it *deforms*. The body gets squashed
horizontally, one wing droops down, patrol speed drops to 70%, the
flying altitude drops by one unit, and three yellow stars start
orbiting its head. That's a concussion animation. A concussion
animation. On a pterodactyl. Because one-shot kills aren't dramatic
enough, and a dazed confused dinosaur is very funny.

### Eight eggs, eight rescues, one win screen

Pink-spotted eggs are scattered through the level. Walk into one and
it hatches a companion. The companion starts at the egg's position and
follows the player at a delay pulled from the player's position trail —
each new companion follows at a slightly later frame in the trail, so
they make a little parade.

Rescue all eight and you get a win screen specific to your character:

- Halil: **ALL 8 MICKEYS RESCUED!**
- Lara: **ALL 8 MINNIES RESCUED!**
- Karolcia: **ALL 8 SCOOBYS RESCUED!**

None of those plurals are strictly correct English. Each one was typed
by hand with love.

### Eggs don't spawn on spikes

At some point an egg must have spawned on a spike, and someone must
have run toward it, and then died. The fix is in the code:

```js
for (let i = 0; i < 8; i++) {
  let ex = 20 + i * 40 + Math.random() * 20;
  for (const h of hazards) {
    if (Math.abs(ex - h.position.x) < 2) ex += 3;
  }
  createEgg(ex, GROUND_Y);
}
```

A nudge loop. For each of the eight eggs, any nearby spike pushes the
spawn three units sideways. Design by playtesting with a six-year-old:
the world now refuses to put rescue targets on lethal terrain.

### 5 kills = 1 extra life, pipped in poop emojis

The HUD has a row of five little circles. Each enemy you stomp fills
one circle with a 💩. On the fifth stomp, the whole row briefly glows
green, a rising-tone "life-up" chord plays, and your heart count
increases by one. Cap is ten hearts — you almost never get there
without trying to.

The pip emoji isn't decorative. It's a conscious pick. Every element
of this game that could have been generic isn't.

### The shield is a ring of tiny pixel hearts

Pick up the right kind of coin and a shield activates. The shield is
rendered as sixteen tiny pixel hearts arranged around a capsule that
hugs the character's body. The hearts *flow* around the capsule —
positions sampled from a 128-entry lookup table with `t = i/16 + time
* 0.15`, so each heart continuously slides to the next heart's
starting spot. A breathing animation scales them with `1 + sin(time *
3 + i * 0.7) * 0.06`. Opacity animates on the same sine.

That's a lot of code for "you got a power-up" indicator. The HUD even
pulses a matching color glow so the pickup feels like a small
ceremony. If a thing is worth having in a game, it's worth making it
feel like a thing worth having.

## Credits

Built with your daughter. Every enemy, every puddle, every "GAW GAW"
was her idea or ours together. Claude helped move the furniture
around.
