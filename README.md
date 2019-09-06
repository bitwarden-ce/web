# ByteGarden Web
[![Docker pulls](https://img.shields.io/docker/pulls/bytegarden/web.svg)](https://hub.docker.com/u/bytegarden)
[![Docker stars](https://img.shields.io/docker/stars/bytegarden/web.svg)](https://hub.docker.com/u/bytegarden)
[![Mattermost](https://img.shields.io/badge/mattermost-join%20char-orange.svg)](https://most.kokakiwi.net/signup_user_complete/?id=1atxn5ydk3g8pe4omy1akmhoaw)
[![CrowdIn](https://img.shields.io/badge/translate-blue.svg)](https://crowdin.com/project/bytegarden)

The ByteGarden web project is an Angular application that powers the web vault.

## Build/Run

### Requirements

- [Node.js](https://nodejs.org) v8.11 or greater

### Run the app

```
npm install
npm run build:watch
```

You can now access the web vault in your browser at `https://localhost:8080`. You can adjust your API endpoint settings in `src/app/services/services.module.ts` by altering the `apiService.setUrls` call. For example:

```typescript
await apiService.setUrls({
    base: isDev ? null : window.location.origin,
    api: isDev ? 'http://mylocalapi' : null,
    identity: isDev ? 'http://mylocalidentity' : null,
});
```
