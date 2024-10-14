---
toc: false
---

```js
import {
  getSpotifyAuthorization,
  getSpotifyToken,
} from "./components/getSpotifyToken.js";
import { AuthenticationButton } from "./components/AuthenticationButton.js";
```

<div class="hero">
  <h1>AudioForma</h1>
  <p>This is a visual exploration into what makes a song unique.</p>
  <p>For this first pass, there's two takes on what a song "looks" like:</p>
  <p><b>Explore: </b>Where can we place songs in space, based on a comparison of their characteristics?</p>
  <p><b>Song Details: </b> What does the tonality of a song look like, whenn we plot out the freuqnecy against the circle of fifths?</p>
  
  <p>There are some tracks pre-loaded for analysis, but if you want you can load your own spotify tracks for a personalized experience.</p>
</div>

```tsx
display(<AuthenticationButton pageName="" />);
```

<style>

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: var(--sans-serif);
  margin: 4rem 0 8rem;
  text-wrap: balance;
  text-align: center;
}

.hero h1 {
  margin: 1rem 0;
  padding: 1rem 0;
  max-width: none;
  font-size: 14vw;
  font-weight: 900;
  line-height: 1;
  background: linear-gradient(30deg, var(--theme-foreground-focus), currentColor);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero h2 {
  margin: 0;
  max-width: 34em;
  font-size: 20px;
  font-style: initial;
  font-weight: 500;
  line-height: 1.5;
  color: var(--theme-foreground-muted);
}

@media (min-width: 640px) {
  .hero h1 {
    font-size: 90px;
  }
}

</style>
