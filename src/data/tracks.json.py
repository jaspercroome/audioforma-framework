import json
import sys
import numpy as np
import pandas as pd
import datetime
from sklearn.preprocessing import StandardScaler
from sklearn.manifold import TSNE
from sklearn.cluster import DBSCAN
from collections import Counter

with open('src/data/my_tracks.json') as filesource:
    data = json.load(filesource)

current_time = datetime.datetime.now()
tracks_data = data['tracks']

df = pd.DataFrame(tracks_data)

df['tempo_bucketed'] = (df['tempo'] // 30) * 30
df['energy_bucketed'] = (((df['energy']*100) // 20) * 20 )/ 100
df['danceability_bucketed'] = (((df['danceability']*100) // 10) * 10)
df['valence_bucketed'] = (((df['valence']*100) // 10) * 10)

features = ['key','mode', 'time_signature', 'energy_bucketed', 'danceability_bucketed', 'valence_bucketed']

filtered_df = df.dropna(subset=features)
X = filtered_df[features]

# Normalize the features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Reduce dimensions using t-SNE
tsne = TSNE(n_components=3, random_state=30, early_exaggeration=12)
X_tsne = tsne.fit_transform(X_scaled)

# Apply DBSCAN to the t-SNE output
dbscan = DBSCAN(eps=1.1, min_samples=5)
cluster_labels = dbscan.fit_predict(X_tsne)

# Add cluster labels to the dataframe
filtered_df['cluster'] = cluster_labels

# Grab the artist's name and preview URL
filtered_df['artist_name'] = filtered_df['artists'].apply(
    lambda x: x[0]['name'] if isinstance(x, list) and len(x) > 0 else ""
)
filtered_df['previewUrl'] = filtered_df['previewUrl'].apply(lambda x: x if isinstance(x, str) else "")

# Find a representative track for each cluster and create cluster descriptions
cluster_representatives = []
for cluster_id in set(cluster_labels):
    if cluster_id == -1:
        continue  # Skip the noise points (DBSCAN labels them as -1)

    # Get all tracks in the current cluster
    cluster_tracks = filtered_df[filtered_df['cluster'] == cluster_id]

    # Calculate the centroid of the cluster
    cluster_centroid = X_tsne[filtered_df['cluster'] == cluster_id].mean(axis=0)

    # Find the track closest to the centroid
    closest_index = np.linalg.norm(X_tsne[filtered_df['cluster'] == cluster_id] - cluster_centroid, axis=1).argmin()
    representative_track = cluster_tracks.iloc[closest_index]

    avg_energy = cluster_tracks['energy'].mean()
    avg_tempo = cluster_tracks['tempo_bucketed'].mean()
    common_key = Counter(cluster_tracks['key']).most_common(1)[0][0]
    common_mode = Counter(cluster_tracks['mode']).most_common(1)[0][0]

    # Convert key from integer to note representation
    key_mapping = {
        0: "C",
        1: "C#",
        2: "D",
        3: "D#",
        4: "E",
        5: "F",
        6: "F#",
        7: "G",
        8: "G#",
        9: "A",
        10: "A#",
        11: "B",
    };
    common_key_note = key_mapping[common_key]

    # Define energy level dynamically
    if avg_energy < 0.3:
        energy_level = "low energy"
    elif avg_energy < 0.7:
        energy_level = "moderate energy"
    else:
        energy_level = "high energy"

    cluster_description = (
        f"This group of songs has a {energy_level}, "
        f"with an average tempo of around {avg_tempo:.0f} beats per minute (BPM). "
        f"The most common key is {common_key_note}, "
        f"and the songs tend to be in a {'major' if common_mode == 1 else 'minor'} scale, "
        f"which gives them a {'brighter' if common_mode == 1 else 'darker'} feel."
    )

    # Add representative track to list, modifying the track ID
    cluster_representatives.append({
        'id': f"rep_{representative_track['id']}",
        'name': representative_track['name'],
        'artist': representative_track['artist_name'],
        'previewUrl': representative_track['previewUrl'],
        'tsne': X_tsne[filtered_df.index.get_loc(representative_track.name)].tolist(),
        'cluster': int(cluster_id),
        'isRepresentative': True,
        'clusterDescription': cluster_description
    })

# Merge results with track IDs
merged_data = [
    {
        'id': track_id,
        'name': name,
        'artist': artist,
        'previewUrl': previewUrl,
        'energy': float(energy),
        'valence': float(valence),
        'danceability': float(danceability),
        'key': int(key),
        'mode': int(mode),
        'timeSignature': int(time_signature),
        'tsne': tsne_coords.tolist(),
        'cluster': int(cluster),
        'isRepresentative': False
    }
    for track_id, name, artist, previewUrl, energy, valence, danceability, key, mode, time_signature, tsne_coords, cluster
    in zip(filtered_df['id'], filtered_df['name'], filtered_df['artist_name'], filtered_df['previewUrl'],
           filtered_df['energy'], filtered_df['valence'], filtered_df['danceability'], filtered_df['key'],
           filtered_df['mode'], filtered_df['time_signature'], X_tsne, filtered_df['cluster'])
]

# Include cluster representatives in the final output
merged_data.extend(cluster_representatives)

json.dump(merged_data, sys.stdout)
