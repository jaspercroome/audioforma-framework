export async function getSpotifyData() {
  const clientId = "6b58815e509940539428705cce2b1d14";
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  if (!code) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://localhost:3000/explore");
    params.append("scope", "user-library-read");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
  } else {
    const accessToken = await getAccessToken(clientId, code);

    const songData = await getMySongData(accessToken);
    const songIds = songData.map((song) => song.id);
    const songAudioFeatures = await getSongAudioFeatures(songIds, accessToken);
    const compiledData = songData.map((song) => {
      const audioFeatures = songAudioFeatures.find((af) => af.id === song.id);
      return { ...song, ...audioFeatures };
    });
    return compiledData;
  }
}
function generateCodeVerifier(length: number) {
  let text = "";
  let possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
async function generateCodeChallenge(codeVerifier: string) {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
async function getAccessToken(clientId: string, code: string): Promise<string> {
  const verifier = localStorage.getItem("verifier");

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", "http://localhost:3000/explore");
  params.append("code_verifier", verifier!);

  const result = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const { access_token } = await result.json();
  return access_token;
}
const getMySongData = async (
  accessToken: string,
  url?: string,
  accumulatedData: Array<{
    id: string;
    previewUrl: string;
    name: string;
    href: string;
    artists: Array<{ name: string }>;
  }> = []
): Promise<
  Array<{ id: string; previewUrl: string; artists: Array<{ name: string }> }>
> => {
  const defaultUrl = "https://api.spotify.com/v1/me/tracks?limit=50";
  const response = await fetch(url ?? defaultUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data: {
    next: string | null;
    items: Array<{
      added: string;
      track: {
        id: string;
        name: string;
        href: string;
        preview_url: string;
        artists: Array<{ name: string }>;
      };
    }>;
  } = await response.json();

  // Accumulate items from the current response
  const allData = accumulatedData.concat(
    data.items.map((item) => ({
      id: item.track.id,
      previewUrl: item.track.preview_url,
      name: item.track.name,
      href: item.track.href,
      artists: item.track.artists.map((a) => ({ name: a.name })),
    }))
  );

  // If there's a next page, continue fetching recursively
  if (data.next) {
    return await getMySongData(accessToken, data.next, allData);
  }

  // If there's no next page, return all collected items
  return allData;
};
const getSongAudioFeatures = async (
  idList: Array<string>,
  accessToken: string
) => {
  const songCount = idList.length;
  let incrementor = 0;
  let songFeatures: Array<{ [keyname: string]: string | number }> = [];
  while (incrementor <= songCount) {
    const limit = incrementor + 99;
    const slicedIds = idList.slice(incrementor, limit).join("%2C");
    const response = await fetch(
      `https://api.spotify.com/v1/audio-features?ids=${slicedIds}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const data = await response.json();
    const audioFeatures = data.audio_features;
    songFeatures.push(...audioFeatures);
    incrementor += 100;
  }
  return songFeatures;
};
