const my_songs = async () => {
  const spotify_id = "";
  const no_way = "";
  const token = await fetch("https://accounts.spotify.com/api/token", {
    body: `grant_type=client_credentials&client_id=${spotify_id}&client_secret=${no_way}`,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });
  const { access_token: accessToken } = await token.json();
  const response = await fetch(
    "https://api.spotify.com/v1/artists/4Z8W4fKeB5YxbusRsdQVPb",
    {
      headers: {
        Authorization: `Bearer  ${accessToken}`,
      },
    }
  );
  return response;
};
console.info(JSON.stringify(my_songs()));
