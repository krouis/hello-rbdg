# hello-rbdg

A collection of small sample webapps for **Meta Ray-Ban Display Glasses**, built as a hands-on test of the [Meta Wearables Web App AI Toolkit](https://github.com/facebookincubator/meta-wearables-webapp) with [Claude Code](https://claude.ai/code).

The repo doubles as a tutorial: every file is annotated to explain the patterns — display physics, D-pad navigation, focus management, screen transitions — that every RBDG webapp needs.

---

## Apps

| App | Path | What it demonstrates |
|-----|------|----------------------|
| **Launcher** | `/` | App grid, tile navigation, linking between apps |
| **Hello** | `apps/hello/` | Multi-screen SPA, wave counter, localStorage persistence |
| **Quiz** | `apps/quiz/` | Dynamic rendering, stateful UI, auto-focus after interaction |

Live URL: **https://krouis.github.io/hello-rbdg/**

---

## Requirements

| Requirement | Details |
|-------------|---------|
| Glasses | Ray-Ban Meta Display Glasses |
| App | Meta AI app (iOS or Android) |
| Developer Mode | Must be enabled in the Meta AI app |
| Hosting | HTTPS from a publicly accessible URL (GitHub Pages qualifies) |

> The webapp must be served over HTTPS. `http://` and `localhost` URLs will not load on the glasses.

---

## Load the webapp on your glasses

These steps follow the [official Meta developer documentation](https://wearables.developer.meta.com/docs/develop/webapps/test).

### 1 — Enable Developer Mode

Open the **Meta AI app** and enable Developer Mode in the settings. (cf. [Enabling Developer Mode in the Meta AI app](https://wearables.developer.meta.com/docs/develop/webapps/setup/#enabling-developer-mode-in-the-meta-ai-app))

### 2 — Add the webapp

1. Open the **Meta AI app**.
2. Open the left panel and go to **App Settings → App Connections**.
3. Tap **Web Apps → Add a Web App**.
4. Enter a name (e.g. `RBDG Hello`) and the URL:
   ```
   https://krouis.github.io/hello-rbdg/
   ```
5. Tap **Connect**.

### 3 — Launch on your glasses

The webapp appears immediately in your glasses' app grid. Select it to launch. You can pin it for quicker access.

### 4 — Navigate

| Action | Glasses | Browser (for testing) |
|--------|---------|----------------------|
| Move focus | D-pad swipe / EMG wrist pinch | Arrow keys |
| Select | Tap gesture | Enter |
| Back | Double pinch | Escape |

---

## Test locally (no glasses needed)

Open `index.html` in Chrome, open DevTools, and set the viewport to **600 × 600 px**. Arrow keys and Enter replicate the D-pad and tap gestures exactly.

---

## Add a new app

1. Copy an existing app as a template:
   ```
   cp -r apps/hello apps/myapp
   ```
2. Edit `apps/myapp/index.html`, `styles.css`, and `app.js`.
3. Add a tile to the root `index.html`:
   ```html
   <a class="app-tile focusable" href="apps/myapp/">
     <span class="tile-icon">🔧</span>
     <span class="tile-name">My App</span>
   </a>
   ```
4. Push to `main` — GitHub Actions deploys automatically.

---

## How this repo was built

The scaffold, apps, and CI workflow were generated with **Claude Code** using the [Meta Wearables Web App AI Toolkit](https://github.com/facebookincubator/meta-wearables-webapp) plugin. The toolkit provides display guidelines, component patterns, and skills (`/create-webapp`, `/add-ui`, `/connect-api`, etc.) that Claude uses to produce glasses-compliant code.

---

## License

MIT — see [LICENSE](LICENSE).
