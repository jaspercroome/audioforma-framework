import * as React from "npm:react";
import { useRef, useState, useEffect } from "npm:react";
import * as d3 from "npm:d3";
import { default as meyda } from "npm:meyda";

const noteNames = {
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
const noteAngles = {
  C: 0,
  G: 30,
  D: 60,
  A: 90,
  E: 120,
  B: 150,
  "F#": 180,
  "C#": 210,
  "G#": 240,
  "D#": 270,
  "A#": 300,
  F: 330,
};
const NOTE_FREQUENCIES: { [note: string]: number } = {
  C: 16.35,
  "C#": 17.32,
  D: 18.35,
  "D#": 19.45,
  E: 20.6,
  F: 21.83,
  "F#": 23.12,
  G: 24.5,
  "G#": 25.96,
  A: 27.5,
  "A#": 29.14,
  B: 30.87,
};

const NOTES = Object.keys(NOTE_FREQUENCIES);

interface NoteInfo {
  note: string;
  octave: number;
  cents: number;
}

const octaves = [0, 1, 2, 3, 4, 5, 6, 7];

const frequencyToNote = (frequency: number): NoteInfo => {
  // Find the base frequency (C0) and calculate how many semitones above it our frequency is
  const baseFreq = NOTE_FREQUENCIES["C"];
  const semitones = 12 * Math.log2(frequency / baseFreq);

  // Calculate the octave and the note within that octave
  const octave = Math.floor(semitones / 12);
  const noteIndex = Math.round(semitones % 12);

  // Get the actual note name
  const note = NOTES[noteIndex];

  // Calculate cents (how far off from the exact note frequency we are)
  const exactFrequency = NOTE_FREQUENCIES[note] * Math.pow(2, octave);
  const cents = Math.round(1200 * Math.log2(frequency / exactFrequency));

  return { note, octave, cents };
};

const processAmplitudeSpectrum = (
  amplitudeSpectrum: number[],
  audioContext: AudioContext
) => {
  const sampleRate = audioContext.sampleRate;
  const binSize = sampleRate / (2 * amplitudeSpectrum.length);

  const keyOctaveAmps: { [key: string]: number } = {};

  amplitudeSpectrum.forEach((amplitude, index) => {
    const frequency = index * binSize;

    // Only process frequencies within the range of musical instruments
    if (frequency >= 20 && frequency <= 20000) {
      const { note, octave, cents } = frequencyToNote(frequency);
      const key = `${note}${octave}`;

      // Only consider amplitudes above a certain threshold to reduce noise
      if (amplitude > 0.01) {
        if (!keyOctaveAmps[key]) {
          keyOctaveAmps[key] = 0;
        }
        // Weight the amplitude based on how close it is to the exact note frequency
        const weight = 1 - Math.abs(cents) / 50; // 50 cents = quarter tone
        keyOctaveAmps[key] += amplitude * weight;
      }
    }
  });

  return keyOctaveAmps;
};

export const MeydaChart = (props: { previewUrl: string }) => {
  const baseColor = "#002233";
  const { previewUrl } = props;
  const [width, height] = [400, 600];
  const audioRef = useRef(null);
  const analyzerRef = useRef(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode>(null);
  const [keyOctaveAmplitudes, setKeyOctaveAmplitudes] = useState(null);
  const [chroma, setChroma] = useState<Array<object>>(null);

  const amplitudeScale = d3.scaleLinear().domain([0, 200]).range([1, 100]);

  amplitudeScale.clamp();

  useEffect(() => {
    if (previewUrl) {
      const audioElement = audioRef.current;

      if (!audioElement) return;

      // Initialize the AudioContext only once
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const audioContext = audioContextRef.current;

      // Disconnect and stop existing audio source and analyzer if they exist
      if (analyzerRef.current) {
        analyzerRef.current.stop();
        analyzerRef.current = null;
      }
      if (audioSourceRef.current) {
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
      }

      // Create a new MediaElementAudioSourceNode with the current audio element
      audioSourceRef.current =
        audioContext.createMediaElementSource(audioElement);
      audioSourceRef.current.connect(audioContext.destination);

      // Initialize Meyda analyzer
      analyzerRef.current = meyda.createMeydaAnalyzer({
        audioContext,
        source: audioSourceRef.current,
        bufferSize: 2048,
        featureExtractors: ["amplitudeSpectrum", "chroma"],
        callback: (results) => {
          const { amplitudeSpectrum, chroma } = results;
          setKeyOctaveAmplitudes(
            processAmplitudeSpectrum(amplitudeSpectrum, audioContext)
          );
          setChroma(chroma);
        },
      });

      analyzerRef.current.start();

      // Clean up on unmount or when previewUrl changes
      return () => {
        if (analyzerRef.current) {
          analyzerRef.current.stop();
          analyzerRef.current = null;
        }
        if (audioSourceRef.current) {
          audioSourceRef.current.disconnect();
          audioSourceRef.current = null;
        }
      };
    }
  }, [previewUrl]);
  const radius = 25;
  return (
    <div>
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        src={previewUrl}
        loop
        controls
      />
      {keyOctaveAmplitudes && (
        <div className="bg-gray-100 p-4 rounded-md mt-4">
          <h3 className="font-semibold mb-2">Key and Octave Amplitudes:</h3>
          <div style={{ display: "flex", flexDirection: "row", gap: "2px" }}>
            <svg width={width} height={height} overflow="hidden">
              <defs>
                <filter
                  id="softGlow"
                  height="300%"
                  width="300%"
                  x="-75%"
                  y="-75%"
                >
                  <feMorphology
                    operator="dilate"
                    radius="2"
                    in="SourceAlpha"
                    result="thicken"
                  />

                  <feGaussianBlur
                    in="thicken"
                    stdDeviation="6"
                    result="blurred"
                  />

                  <feFlood flood-color="rgb(250,250,155)" result="glowColor" />

                  <feComposite
                    in="glowColor"
                    in2="blurred"
                    operator="in"
                    result="softGlow_colored"
                  />

                  <feMerge>
                    <feMergeNode in="softGlow_colored" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <rect
                x={0}
                y={0}
                width={width}
                height={height}
                fill={baseColor}
              />
              {/* note labels */}
              {Object.entries(noteAngles).map(([note, degrees], index) => {
                const angle = ((degrees - 90) / 360) * 2 * Math.PI;
                const x = Math.cos(angle) * radius * 6;
                const y = Math.sin(angle) * radius * 6;
                return (
                  <text
                    x={x}
                    y={y}
                    dy="0.3em"
                    transform={`translate(${width / 2}, ${height / 1.45})`}
                    textAnchor="middle"
                    fill={baseColor}
                    opacity={chroma[index] > 0.6 ? chroma[index] : 0}
                    fontFamily="arial"
                    fontWeight="800"
                    filter={chroma[index] > 0.6 ? "url(#softGlow)" : undefined}
                  >
                    {note}
                  </text>
                );
              })}
              {octaves
                .sort((a, b) => b - a)
                .map((octave, octaveIndex) => {
                  const translateValue = `${width / 2}, ${
                    height / 2 + octaveIndex * 25 - 75
                  }`;
                  const probablyPercussion = octave >= 6;
                  const noteNameValues = Object.values(noteNames);
                  return (
                    <g>
                      {noteNameValues.map((note, index) => {
                        const degrees = noteAngles[note] - 90;
                        const angle = (degrees / 360) * 2 * Math.PI;
                        const x = Math.cos(angle) * (radius * 6);
                        const y = Math.sin(angle) * (radius * 6);

                        const amplitude =
                          keyOctaveAmplitudes[`${note}${octave}`] || 0;

                        const color = d3.hsl(degrees, 0.7, 0.5);
                        const rotateValue = noteAngles[note];

                        if (probablyPercussion) {
                          return (
                            <line
                              x1={x - amplitude / 2}
                              x2={x + amplitude / 2}
                              y1={y}
                              y2={y}
                              strokeWidth={4}
                              opacity={0.6}
                              stroke="white"
                              transform={`translate(${translateValue})`}
                            />
                          );
                        } else if (chroma[index] > 0.4)
                          return (
                            <line
                              x1={x - amplitudeScale(amplitude)}
                              x2={x + amplitudeScale(amplitude)}
                              y1={y}
                              y2={y}
                              strokeWidth={4}
                              opacity={0.6}
                              stroke={color}
                              transform={`
                                translate(${translateValue})
                                rotate(${rotateValue} ${x} ${y})
                              `}
                            />
                          );
                      })}
                    </g>
                  );
                })}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
