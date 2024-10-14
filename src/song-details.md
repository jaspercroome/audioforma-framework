---
theme: dashboard
title: Song Details
toc: false
---

# Song Details

Let's take a look at one song in detail, to help understand the visual characteristics of a song.
If you loaded your token on the homepage, this will be your music. If not, I'm sharing my library with you.

```tsx
display(<AuthenticationButton pageName="song-details" />);
```

```js
import { MeydaChart } from "./components/MeydaChart.js";
import { getSpotifyData } from "./components/getSpotifyData.js";
import { AuthenticationButton } from "./components/AuthenticationButton.js";
```

```ts
const token = localStorage.getItem("af-spotifyAccessToken");
```

```ts
const freshSongs = token ? await getSpotifyData(token) : undefined;
const fallbackSongs = await FileAttachment("./data/my_tracks.json").json();
const songs = freshSongs ?? fallbackSongs.tracks;
```

```ts
const songsWithPreviews = songs.filter((item) => item.previewUrl);
const artists = Array.from(
  new Set(songsWithPreviews.map((song) => song.artists[0].name))
).sort();
const selectedArtist = view(
  Inputs.select(artists, {
    multiple: false,
    autocomplete: true,
  })
);
```

```ts
const filteredSongs = songsWithPreviews.filter(
  (song) => song.artists[0].name === selectedArtist
);
```

```ts
const selectedSong = view(
  Inputs.table(filteredSongs, {
    multiple: false,
    columns: [
      "name",
      "albumName",
      "danceability",
      "energy",
      "valence",
      "key",
      "mode",
      "duration_ms",
    ],
    header: { duration_ms: "duration", albumName: "Album name" },
    format: {
      duration_ms: (d) => {
        const totalSeconds = d / 1000;
        const minutes = totalSeconds / 60;
        const seconds = Math.floor(totalSeconds % 60);

        return `${Math.floor(minutes)}:${seconds <= 10 ? "0" : ""}${seconds}`;
      },
      mode: (d) => (d === 1 ? "Major" : "Minor"),
    },
  })
);
```

```jsx
if (songs.length === 0) {
  display(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignContent: "center",
      }}
    >
      <p style={{ fontFamily: "arial", fontSize: "2em", fontWeight: "bolder" }}>
        Loading...
      </p>
    </div>
  );
}
```

```jsx
const preview =
  (await selectedSong?.previewUrl) ??
  filteredSongs?.[0].previewUrl ??
  songsWithPreviews?.[0].previewUrl;
display(<MeydaChart previewUrl={preview} />);
```
