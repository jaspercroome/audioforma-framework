---
theme: dashboard
title: Explore
toc: false
---

# Explore

These songs are placed in space according to their audio characteristics, based on analysis by the team at Spotify.

Songs placed higher vertically were deemed to have a higher 'valence' (i.e., happiness rating). Left-Right and Front-Back are Loudness and Danceability, which are self-explanatory.

Take a look at where certain songs are, and who their neighbors are. Does it make sense? does it not?

```tsx
display(<AuthenticationButton pageName="song-details" />);
```

```js
import { connectAudio } from "./components/connectAudio.js";
import { AuthenticationButton } from "./components/AuthenticationButton.js";
import { getSpotifyData } from "./components/getSpotifyData.js";
import { MeydaChart } from "./components/meydaChart.js";
import { songSpheres } from "./components/songSpheres.js";
```

```ts
const tracks = await FileAttachment("./data/tracks.json").json();
```

```ts
const token = localStorage.getItem("af-spotifyAccessToken");
```

```ts
// uncomment this to load your latest songs, which can then be pasted into my_tracks
const mySongs = await getSpotifyData(token);
```

```ts
const artists = Array.from(
  new Set(
    mySongs
      .filter((song) => song.previewUrl)
      .map((track) => track.artists[0].name)
  )
).sort();
const artistsSelection = view(
  Inputs.select(artists, {
    multiple: true,
    label: "Focus Artists",
  })
);
```

```html
<div
  id="tooltip"
  style="
    position: absolute;
    padding: 8px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border-radius: 4px;
    pointer-events: none;
    visibility: hidden;
    transition: opacity 0.2s ease-out;"
>
  <p id="tooltip-title"></p>
  <p id="preview-prompt" style="visibility: hidden;">
    Click the sphere for a 30s preview
  </p>
</div>
```

```ts
display(songSpheres(mySongs, artistsSelection));
```

```html
<audio id="sample-player" src="" controls autoplay crossorigin="anonymous" />
```
