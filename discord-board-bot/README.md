# discord-board-bot

`/board` slash command for the **omoi** Discord bot. It files a [Plane](https://plane.so) issue and replies with the key and a link. (Research ticket: OPENO-20.)

```
/board title:"fix zebar clock drift" description:"loses ~2s/day" priority:high
→ created OPENO-21: fix zebar clock drift
```

- Small Node service: `discord.js` plus the Plane REST API over built-in `fetch`
- Runs on the **gateway**, not an HTTP interactions endpoint. If you set an Interactions Endpoint URL in the Developer Portal, Discord stops sending *all* of the app's slash commands over the gateway. That would break omoi's other commands.
- Secrets are read only from env vars. `.env` is gitignored, and none are needed for tests or CI.

## Setup (on ak.)

1. **Discord.** Reuse the omoi application:
   - `DISCORD_TOKEN`: Developer Portal → omoi → Bot → Reset Token
   - `DISCORD_APP_ID`: General Information → Application ID
   - `DISCORD_GUILD_ID`: turn on Developer Mode, then right-click the server → Copy Server ID
   - The bot needs the `applications.commands` scope in the guild. It already has it if omoi uses slash commands.
2. **Plane**
   - `PLANE_API_KEY`: Profile Settings → Personal Access Tokens
   - `PLANE_BASE_URL`: `https://api.plane.so` (cloud) or your self-hosted origin
   - `PLANE_WEB_URL`: `https://app.plane.so` for cloud. You can omit it when self-hosted, because it defaults to `PLANE_BASE_URL`.
   - `PLANE_WORKSPACE_SLUG` / `PLANE_PROJECT_ID`: both are in the project URL, `…/<slug>/projects/<project-id>/issues`
3. Optional: `BOARD_ALLOWED_ROLE_IDS=123,456` limits who can file issues.

```sh
cp .env.example .env    # fill it in
npm ci
node --env-file=.env src/register.js   # once: registers /board in the guild
node --env-file=.env src/index.js
```

`register.js` POSTs a single guild command. That upserts `/board` and leaves omoi's other commands alone (a bulk `PUT` would replace them).

### Docker

```sh
docker build -t discord-board-bot .
docker run -d --name board-bot --restart unless-stopped --env-file .env discord-board-bot
```

### Running next to omoi

This bot can log in with omoi's token as a second gateway session. It only answers `/board` and ignores every other interaction. **Check that omoi ignores `/board` too.** If omoi's handler replies "unknown command" to everything it doesn't recognise, both processes will race to respond. Alternatively, import `BOARD_COMMAND` and `handleBoard` from `src/command.js` into omoi and run it in-process.

## Tests

```sh
npm test
```

`node:test` with a mocked `fetch` and fake interactions. It makes no network calls, and CI (`.github/workflows/discord-board-bot.yml`) runs it on Node 20 and 22.

## Notes

- Replies are deferred, because Plane can take longer than Discord's 3 s window.
- The issue description is escaped to HTML, with the footer `via Discord /board by @user in #channel`.
- The project identifier (`OPENO`) is fetched once and cached. If that lookup fails, the reply shows `#<seq>` instead.
- It uses the `/issues/` endpoint, which is supported on both Plane Cloud and self-hosted.
