# Jimitri Hub (unofficial)

Play page, demon list, mod library, tutorial videos, leaderboard, and an admin panel.
No Node.js, no scripts, no secret keys needed.

## Setup

1. **Firebase.** Reuse your old project if it still exists (your levels and records carry over), or make a new one.
   - Build -> Authentication -> Sign-in method -> turn on **Email/Password**.
   - Build -> Firestore Database -> create it if you don't have one.
2. **Rules.** Firestore -> Rules tab -> replace everything with `firestore.rules` from this folder -> Publish.
3. **Put the files on GitHub (new repository).**
   - Fill in `firebase-config.js` first (open it in Notepad, replace each `PASTE_ME` with your Firebase values).
   - On github.com: **+ -> New repository**, name it anything, keep it Public, click **Create repository**.
   - Click **uploading an existing file**, then drag in **everything inside the unzipped `jimitri-hub` folder**
     (the files AND the `game` folder, not the zip itself). Click **Commit changes**.
   - Turn on **Settings -> Pages**: Source = your main branch, root folder.

   Your repo should end up looking exactly like this:

   ```
   index.html            <- the website
   style.css
   app.js
   firebase-config.js    <- your Firebase values
   firestore.rules       <- not used by the site; you paste it into Firebase in step 2
   README.md
   game/
     index.html          <- the game
     game.js
     editor.js
     render.js
     styles.css
     mainlevels.js
     online.js
     jimitri-modloader.js
     at-the-speed-of-light.mp3
   ```

   If the `game` folder doesn't come along when you drag it (some browsers skip folders), click **Add file ->
   Create new file**, type `game/online.js` as the name, and so on, or upload the game's files into the
   `game` folder one by one. After committing, open the `game` folder on GitHub and check all 9 files are there.
   Once Pages is live: the website is at `https://YOURNAME.github.io/REPO/` and the game at `.../REPO/game/`.
4. **Make yourself admin (30 seconds, no code).**
   - Sign up on your live site with your username.
   - Firebase console -> Authentication -> Users -> copy your **User UID**.
   - Firestore -> Data -> **Start collection** -> Collection ID: `admins` -> Document ID: paste your UID ->
     add any field (name `ok`, type boolean, value true) -> Save.
   - Reload the site. You now have an **Admin** tab.
   - Only the Firebase console can create admins; nothing on the website can.

## The game folder (`game/`)

This is the Jimitri Dash source with two additions, so the whole thing runs from one site:

- `online.js` makes the **LEVELS** list shared. Levels uploaded (or imported by code) go to your server and
  show up for everyone. An **ACCOUNT** button (bottom-left) logs in with the same account as the website.
  Only the uploader or staff (you and your mods) can delete a level. Banned accounts can't upload.
- `jimitri-modloader.js` adds the **MODS** button. Mods you install from the website's Mods page land here
  (the Install to game button works because the game and the site share one address).
- `index.html` has two extra lines near the bottom loading those files. Nothing else in the game was changed.

Keep `firebase-config.js` in the **repo root** (next to the website's `index.html`); the game reads it from there.
Put the whole folder structure on GitHub as-is: website files in the root, game files in `game/`.
Ratings and likes in the game are still stored per player, not on the server.

Please get turkball's okay before hosting a public copy of his game, and keep the credits.

## Using it

- **Demon list:** approve submitted records/verifications in the Admin tab.
- **Mods:** players submit a .js/.jdmod file; you read the code (View code) and approve it. Approved mods get a
  share code and download button that work with the Jimitri Mod Loader.
- **Tutorials:** log in as admin, open Tutorials, Add video (YouTube links). Limit is 5; change `MAX_VIDEOS` in `app.js`.
- **Mod staff:** Admin tab -> Users -> Make mod. Mods can approve things but can't ban or edit tutorials.

## Settings in app.js

`GAME_URL` (the game's address) and `MAX_VIDEOS`.

## Credits

Jimitri Dash by turkball. Idea for this remake from specta. Unofficial fan site.
