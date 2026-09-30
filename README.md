# Wargame Reminders

An early-stage project to make tabletop rules easier to use during a game. The initial focus is Warhammer 40,000 10th Edition, with an army-focused reminders experience inspired by [AoS Reminders](https://aosreminders.com/). Age of Sigmar may be considered later.

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

The current data workflow downloads Wahapedia's Warhammer 40,000 10th Edition CSV exports using the links in its [export specification workbook](https://wahapedia.ru/wh40k10ed/Export%20Data%20Specs.xlsx). The next step is to inspect the schemas and convert selected data into a project-owned JSON model. The exports are not yet used by the interface, and the planned Next.js migration is not implemented yet.

## Data sources

- [Wahapedia 40K export data specifications](https://wahapedia.ru/wh40k10ed/Export%20Data%20Specs.xlsx)
- [AoS Reminders](https://aosreminders.com/), the independent project that inspired this project's reminders workflow

Wahapedia CSVs are source snapshots, not the app's permanent data model. The fetch command preserves downloaded files unchanged under the Git-ignored `src/data/wahapedia/wh40k10ed/` directory; parsing and JSON generation will be developed separately. AoS data is out of scope for the current implementation.

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
| `npm run data:fetch` | Fetches the 40K 10th Edition exports |

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, data refresh, and verification steps.