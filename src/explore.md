---
theme: dashboard
title: Explore
toc: false
---

# Explore

Take a look at how my spotify songs compare to one another

```js
import { connectAudio } from "./components/connectAudio.js";
import { getSpotifyData } from "./components/getSpotifyData.js";
import { MeydaChart } from "./components/meydaChart.js";
import { songSpheres } from "./components/songSpheres.js";
```

```ts
const tracks = await FileAttachment("./data/tracks.json").json();
```

```ts
// uncomment this to load your latest songs, which can then be pasted into my_tracks
// const mySongs = await getSpotifyData("explore");
// display(mySongs);
```

```ts
const artists = Array.from(new Set(tracks.map((track) => track.artist))).sort();
const artistsSelection = view(
  Inputs.search(artists, {
    multiple: true,
    label: "Focus Artists",
    autocomplete: true,
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
display(songSpheres(tracks, artistsSelection));
```

```html
<audio id="sample-player" src="" controls autoplay crossorigin="anonymous" />
```
