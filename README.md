# Wargame Reminders

An early-stage project to make tabletop rules easier to use during a game. The long-term goal is to support both Warhammer 40,000 and Age of Sigmar with an army-focused reminders experience inspired by [AoS Reminders](https://aosreminders.com/).

**Live prototype:** https://cjwhitedev.github.io/wargamereminders/

> [!IMPORTANT]
> **This is an AI-assisted side project.**
>
> GitHub Copilot has helped write and maintain project code, scripts, and documentation. The project owner, a front-end developer with more than 10 years of experience, directs the work, chooses features, and reviews changes. AI-generated code and data transformations can be wrong; verify rules and app behavior before relying on them.
>
> A note from Copilot: this is currently a small prototype, not a finished reminders product. I can misunderstand rules, export formats, or project requirements. Check source material and report anything that looks incorrect.

This is an unofficial fan project. It is not affiliated with, endorsed by, or sanctioned by Games Workshop, Wahapedia, or the AoS Reminders project or its author. Warhammer names, rules, and related content belong to their respective rights holders. Consult official publications for authoritative rules.

## Project status

The current app is a Create React App prototype. It reads `src/data/wh40k-10e/Warhammer 40,000.gst` and displays shared rules and profiles. Other BattleScribe catalogues in that directory are not yet connected to the interface.

The current data workflow can download Wahapedia CSV exports for 40K and AoS. The next step is to inspect their schemas and convert selected data into a project-owned JSON model. The export data is not yet used by the interface, and the planned Next.js migration is not implemented yet.

## Data sources

- [Wahapedia 40K 10th Edition data exports](https://wahapedia.ru/wh40k10ed/the-rules/data-export/)
- [Wahapedia 40K export data specifications](https://wahapedia.ru/wh40k10ed/Export%20Data%20Specs.xlsx)
- [Wahapedia AoS 4 data exports](https://wahapedia.ru/aos4/the-rules/data-export/)
- [AoS Reminders](https://aosreminders.com/), the independent project that inspired this project's reminders workflow

Wahapedia files are source snapshots, not the app's permanent data model. The fetch command preserves downloaded files unchanged under the Git-ignored `src/data/wahapedia/` directory; parsing and JSON generation will be developed separately.

## Local development

```sh
npm install
npm start
```

Open http://localhost:3000.

| Command | Purpose |
| --- | --- |
| `npm start` | Starts the development server |
| `npm test -- --watchAll=false` | Runs the current test suite once |
| `npm run build` | Builds the app into `build/` |
| `npm run deploy` | Builds and publishes `build/` to GitHub Pages |
| `npm run data:fetch -- --game 40k` | Fetches the 40K exports |
| `npm run data:fetch -- --game aos` | Fetches the AoS exports |
| `npm run data:fetch -- --game all` | Fetches both export sets |

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, data refresh, and verification steps.