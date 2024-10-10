---
theme: dashboard
title: Song Details
toc: false
---

# Song Details

Let's take a look at one song in detail, to help understand the visual characteristics of a song.

```js
import { MeydaChart } from "./components/MeydaChart.js";
import { getSpotifyData } from "./components/getSpotifyData.js";
```

```ts
// const freshSongs = await getSpotifyData("song-details");
const fallbackSongs = await FileAttachment("./data/my_tracks.json").json();
const songs = fallbackSongs.tracks;
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
    // format: (d) => d.name,
  })
);
```

```ts
const filteredSongs = songsWithPreviews.filter(
  (song) => song.artists[0].name === selectedArtist
);
display(filteredSongs);
```

```ts
const selectedSong = view(
  Inputs.table(filteredSongs, {
    multiple: false,
    columns: [
      "name",
      "danceability",
      "energy",
      "valence",
      "key",
      "mode",
      "duration_ms",
    ],
    header: { duration_ms: "duration" },
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
const preview =
  (await selectedSong?.previewUrl) ??
  filteredSongs?.[0].previewUrl ??
  songsWithPreviews?.[0].previewUrl;
display(<MeydaChart previewUrl={preview} />);
```

<!-- ```jsx
const render = () => {
  const track = selectedSong.track_href;
  return (
    <iframe
      style="border-radius: 12px"
      width="100%"
      height="152"
      title="Spotify Embed: My Path to Spotify: Women in Engineering"
      frameborder="0"
      allowfullscreen
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      src={track}
    ></iframe>
  );
};
render();
``` -->
