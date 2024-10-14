import * as React from "react";
import { useRef, useState, useEffect } from "npm:react";

export const AuthenticationButton = (props: { pageName: string }) => {
  const clientId = "6b58815e509940539428705cce2b1d14";
  const accessToken = localStorage.getItem(spotifyAccessTokenKey);
  const expirationDate = localStorage.getItem(spotifyExpiryKey);
  const isStale = new Date() >= new Date(Number(expirationDate) ?? "");

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (code) {
    getAccessToken(clientId, code, props.pageName).then(() => {
      const location = window.location;
      const url = new URL(location.href);
      url.searchParams.delete("code");
      history.replaceState(null, "placeholder", url);
    });
  }

  if (accessToken && !isStale) {
    return (
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          textAlign: "center",
        }}
      >
        <p style={{ fontFamily: "arial" }}>
          You've successfully authenticated. You'll need to refresh your token
          again at:
        </p>
        <p>{new Date(Number(expirationDate)).toLocaleString()}</p>
      </div>
    );
  }

  let buttonString = "Authorize Spotify Access";
  let buttonFn: () => void = () =>
    getSpotifyAuthorization(clientId, props.pageName);

  if (expirationDate && isStale) {
    buttonString = "Refresh Spotify Access";
    buttonFn = () =>
      refreshAccessToken(clientId).then(() => {
        window.location.reload();
      });
  }

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "8px",
      }}
    >
      <button
        style={{
          borderRadius: "8px",
          padding: "8px",
          height: "fit-content",
          width: "fit-content",
          background: "#1ed760",
          color: "#121212",
          fontWeight: "600",
          cursor: "pointer",
        }}
        onClick={buttonFn}
      >
        {buttonString}
      </button>
    </div>
  );
};

const spotifyAccessTokenKey = "af-spotifyAccessToken";
const spotifyExpiryKey = "af-spotifyExpiryTime";
const spotifyRefreshTokenKey = "af-spotifyRefreshToken";

export const getSpotifyAuthorization = async (
  clientId: string,
  pageName: string
) => {
  const baseUrl = window.location.origin;

  const accessToken = localStorage.getItem(spotifyAccessTokenKey);
  const expiryTimeString = localStorage.getItem(spotifyExpiryKey);
  const isStale = new Date(expiryTimeString ?? "") < new Date();
  if (accessToken && !isStale) {
    return accessToken;
  }
  const verifier = generateCodeVerifier(128);
  const challenge = await generateCodeChallenge(verifier);

  localStorage.setItem("verifier", verifier);

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("response_type", "code");
  params.append("redirect_uri", `${baseUrl}/${pageName}`);
  params.append("scope", "user-library-read");
  params.append("code_challenge_method", "S256");
  params.append("code_challenge", challenge);

  document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
};
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

export const getAccessToken = async (
  clientId: string,
  code: string,
  pageName: string
) => {
  const storedAccessToken = localStorage.getItem(spotifyAccessTokenKey);
  const storedRefreshToken = localStorage.getItem(spotifyRefreshTokenKey);
  const expiryDateTime = localStorage.getItem(spotifyExpiryKey);
  const isStale = new Date() >= new Date(expiryDateTime ?? "");

  if (!isStale && storedAccessToken) {
    return storedAccessToken;
  } else {
    const baseUrl = window.location.origin;
    if (storedAccessToken === null || storedRefreshToken === null) {
      const verifier = localStorage.getItem("verifier");

      const params = new URLSearchParams();
      params.append("client_id", clientId);
      params.append("grant_type", "authorization_code");
      params.append("code", code);
      params.append("redirect_uri", `${baseUrl}/${pageName}`);
      params.append("code_verifier", verifier!);

      const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      });
      const data = await result.json();
      const { access_token, refresh_token, expires_in } = data;
      const now = new Date();
      const expirationDate = Number(now) + expires_in * 1000;
      localStorage.setItem(spotifyAccessTokenKey, access_token);
      localStorage.setItem(spotifyExpiryKey, expirationDate.toString());
      if (refresh_token) {
        localStorage.setItem(spotifyRefreshTokenKey, refresh_token);
      }
      return access_token as string;
    } else {
      const url = "https://accounts.spotify.com/api/token";
      const payload = {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: storedRefreshToken,
          client_id: clientId,
        }),
      };
      const body = await fetch(url, payload);
      const response = await body.json();
      localStorage.setItem(spotifyAccessTokenKey, response.accessToken);
      if (response.refreshToken) {
        localStorage.setItem(spotifyRefreshTokenKey, response.refreshToken);
      }
      return response.accessToken as string;
    }
  }
};
export const refreshAccessToken = async (clientId: string) => {
  // refresh token that has been previously stored
  const refreshToken = localStorage.getItem(spotifyRefreshTokenKey);
  const url = "https://accounts.spotify.com/api/token";

  if (refreshToken) {
    const payload = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
      }),
    };
    const body = await fetch(url, payload);
    const response = await body.json();
    const { access_token, expires_in, refresh_token } = response;
    localStorage.setItem(spotifyAccessTokenKey, access_token);

    if (response.expires_in) {
      const now = Number(new Date());
      const expirationDate = (now + expires_in * 1000).toString();
      localStorage.setItem(spotifyExpiryKey, expirationDate);
    }

    if (response.refreshToken) {
      localStorage.setItem(spotifyRefreshTokenKey, refresh_token);
    }
  }
};
