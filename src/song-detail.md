---
theme: dashboard
title: Song Details
toc: false
---

# Song Details

Let's take a look at one song in detail, to help understand the visual characteristics of a song.

```js
import { MeydaChart } from "./components/MeydaChart.js";
```

```ts
const { tracks: sampleTracks } = await FileAttachment(
  "./data/my_tracks.json"
).json();
const songsWithPreviews = sampleTracks.filter((item) => item.previewUrl);
const selectedTrack = view(
  Inputs.select(songsWithPreviews, {
    multiple: false,
    autocomplete: true,
    format: (d) => `${d.name} - ${d.artists[0].name}`,
  })
);
```

```jsx
display(<MeydaChart previewUrl={selectedTrack.previewUrl} />);
```
