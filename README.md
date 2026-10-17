# 🐱 Cat Fish

A small browser puzzle game. Guide the cat across a grid, collect every fish, and get home safely, all while avoiding hidden dogs that guard the edges of their tiles.

**Play it online:** `https://nihaltiwari01.github.io/catFish/`

## How to Play

- Start at the dark square where the cat 🐱 begins.
- Move with the **Arrow Keys** on a keyboard, or the on-screen arrow buttons on phones and tablets.
- Collect all the fish 🐟 on the board first.
- Then reach the house 🏡 to finish the level.
- Dogs 🐶 are hidden. Each one blocks one specific edge of its tile. If you run into one, the level resets and you lose points.

## Scoring

| Action | Points |
| --- | --- |
| Collect a fish | +50 |
| Finish a level | +100 |
| Run into a dog | -50 |
| Use "Show Dogs" | -100 |

Your high score is saved in your browser, so it is still there next time you play.

## Levels

| Level | Grid size | Fish |
| --- | --- | --- |
| 1 | 5 × 5 | 2 |
| 2 | 6 × 6 | 4 |
| 3 | 7 × 7 | 5 |

## Features

- Three levels with growing difficulty
- Keyboard and touch controls
- Light and dark (night) theme
- Sound effects (powered by Tone.js)
- Responsive layout for desktop and mobile
- High score saved with `localStorage`

## Run It Locally

No build step or installation needed.

1. Download or clone this repository.
2. Open `index.html` in any modern browser.

An internet connection is needed on first load because the game pulls Tailwind CSS and Tone.js from a CDN.

## Built With

- HTML, CSS and JavaScript
- [Tailwind CSS](https://tailwindcss.com/) (via CDN)
- [Tone.js](https://tonejs.github.io/) (via CDN) for audio

## Deploy with GitHub Pages

1. Push the project to GitHub.
2. Go to **Settings → Pages**.
3. Under **Branch**, select `main` and `/ (root)`, then save.
4. Your game will be live after a minute or two.

## License

Add a license of your choice, for example MIT, or remove this section.
