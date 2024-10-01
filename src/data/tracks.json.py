import json
import sys
import numpy as np
import pandas as pd
import datetime
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE

def generate_sample_tracks():
  sample_tracks = [
        {
            "id": "sample_dance_energy1",
            "name": "High Energy, Danceable",
            "danceability": 0.9,
            "energy": 0.9,
            "loudness": 0,
            "tempo": 130,
            "valence": 0.7,
            "key": 1
        },
        {
            "id": "sample_loud_fast1",
            "name": "Loud, Fast & Happy",
            "danceability": 0.6,
            "energy": 0.8,
            "loudness": -2.0,
            "tempo": 160,
            "valence": 0.8,
            "key": 8
        },
        {
            "id": "sample_happy_high2",
            "name": "Fast & Happy",
            "danceability": 0.75,
            "energy": 0.65,
            "loudness": -5.5,
            "tempo": 125,
            "valence": 0.95,
            "key": 9
        },
        {
            "id": "sample_loud_angry",
            "name": "Loud & Angry",
            "danceability": 0.55,
            "energy": 0.85,
            "loudness": -1.5,
            "tempo": 120,
            "valence": 0.2,
            "key": 5
        },
        {
            "id": "sample_slow_sad",
            "name": "Slow & Sad",
            "danceability": 0.55,
            "energy": 0.2,
            "loudness": -7.5,
            "tempo": 60,
            "valence": 0,
            "key": 5
        },
        {
            "id": "sample_no_dancing",
            "name": "No Dancing",
            "danceability": 0,
            "energy": 0.5,
            "loudness": -3.5,
            "tempo": 90,
            "valence": 0.5,
            "key": 5
        },
        {
            "id": "sample_chill_dancing",
            "name": "Chill Dancing",
            "danceability": 1,
            "energy": 0.2,
            "loudness": -3.5,
            "tempo": 90,
            "valence": 0.5,
            "key": 5
        }
    ]
  return sample_tracks

with open('src/data/raw_tracks.json') as filesource:
  data = json.load(filesource)

current_time = datetime.datetime.now()
tracks_data = data['tracks']

sample_tracks = generate_sample_tracks()
tracks_data.extend(sample_tracks)

# Prepare features
features = ['danceability', 'energy', 'loudness', 'tempo', 'valence','key',"acousticness"]

df = pd.DataFrame(tracks_data)

X = df[features]

# Normalize the features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Reduce dimensions using PCA
pca = PCA(n_components=3)
X_pca = pca.fit_transform(X_scaled)

# Reduce dimensions using t-SNE
tsne = TSNE(n_components=3, random_state=42, learning_rate=100)
X_tsne = tsne.fit_transform(X_scaled)

# Grab the artist's name
df['artist_name'] = df['artists'].apply(
    lambda x: x[0]['name'] if isinstance(x, list) and len(x) > 0 else ""
)
df['preview_url'] = df['preview_url'].apply(lambda x: x if isinstance(x,str) else "")

# Merge results with track IDs
merged_data = [
    {
        'id': track_id,
        'name': name,
        'artist':artist,
        'preview_url': preview_url,
        'energy':energy,
        'loudness':loudness,
        'valence':valence,
        'danceability':danceability,
        'acousticness':acousticness,
        'pca': pca_coords.tolist(),
        'tsne': tsne_coords.tolist()
    }
    for track_id, name, artist, preview_url, energy, valence, loudness,danceability,acousticness, pca_coords, tsne_coords in zip(df['id'], df['name'], df['artist_name'], df['preview_url'],df['energy'],df['valence'],df['danceability'], df['acousticness'], df['loudness'], X_pca, X_tsne)
]

json.dump(merged_data, sys.stdout)