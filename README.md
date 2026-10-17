


# 🐱 Cat Fish

A small browser puzzle game. Guide the cat across a grid, collect every fish, and get home safely, all while avoiding hidden dogs that guard the edges of their tiles.

**Play it online:** [https://nihaltiwari01.github.io/cat-Fish-Game/](https://nihaltiwari01.github.io/cat-Fish-Game/)

## Gameplay Video

<!-- Add your gameplay recording here later. Pick ONE of the options below and delete the rest. -->
https://github.com/user-attachments/assets/ba66558d-908d-47cc-957e-7bdac967fd2a

<!--
Option 1: Upload the video to YouTube and link a thumbnail
[![Watch the gameplay](https://img.youtube.com/vi/YOUR_VIDEO_ID/maxresdefault.jpg)](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)

Option 2: Put the video file in your repo (e.g. a "media" folder) and link it
[Watch the gameplay video](media/gameplay.mp4)

Option 3: Use a GIF (works inline in the README)
![Gameplay](media/gameplay.gif)

Option 4: Drag and drop the video into the README while editing it on github.com.
GitHub uploads it and inserts a link that plays right on the page.
-->

## How to Play

- Start at the dark square where the cat 🐱 begins.
- Move with the **Arrow Keys**, the on-screen arrow buttons, or your **mouse/finger**: click a tile next to the cat to move there.
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
| Use "AI Solve" | -200 (no points earned for that run) |

Your high score is saved in your browser, so it is still there next time you play.

## Levels

| Level | Grid size | Fish |
| --- | --- | --- |
| 1 | 5 × 5 | 2 |
| 2 | 6 × 6 | 4 |
| 3 | 7 × 7 | 5 |

## Features

- Three levels with growing difficulty
- 🤖 AI Solve button: the cat collects all the fish and walks home on its own
- Keyboard, mouse and touch controls
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
