import * as React from "react";
import { useRef, useState, useEffect } from "npm:react";
import * as d3 from "d3";
import { default as meyda } from "meyda";

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

const octaves = [0, 1, 2, 3, 4, 5, 6, 7];

const frequencyToNote = (frequency) => {
  const noteNumber = 12 * (Math.log2(frequency / 440) + 4);
  const octave = Math.floor(noteNumber / 12);
  const noteIndex = Math.round(noteNumber % 12);
  return { note: noteNames[noteIndex], octave };
};

const processAmplitudeSpectrum = (amplitudeSpectrum, audioContext) => {
  const sampleRate = audioContext.sampleRate;
  const binSize = sampleRate / (2 * amplitudeSpectrum.length);

  const keyOctaveAmps = {};

  amplitudeSpectrum.forEach((amplitude, index) => {
    const frequency = index * binSize;
    const { note, octave } = frequencyToNote(frequency);
    const key = `${note}${octave}`;

    if (!keyOctaveAmps[key]) {
      keyOctaveAmps[key] = 0;
    }
    keyOctaveAmps[key] += amplitude;
  });

  return keyOctaveAmps;
};

export const MeydaChart = (props: { previewUrl: string }) => {
  const { previewUrl } = props;
  const [width, height] = [400, 600];
  const audioRef = useRef(null);
  const analyzerRef = useRef(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode>(null);
  const [keyOctaveAmplitudes, setKeyOctaveAmplitudes] = useState(null);

  const opacityScale = d3.scaleLinear().domain([15, 200]).range([0, 1]);

  useEffect(() => {
    if (previewUrl) {
      if (audioRef.current) {
        const audioContext = new window.AudioContext();
        if (!audioSourceRef.current) {
          audioSourceRef.current = audioContext.createMediaElementSource(
            audioRef.current
          );
          audioSourceRef.current.connect(audioContext.destination);
        }

        analyzerRef.current = meyda.createMeydaAnalyzer({
          audioContext: audioContext,
          source: audioSourceRef.current,
          bufferSize: 2048,
          featureExtractors: [
            "amplitudeSpectrum",
            // "spectralFlatness",
            // "spectralCentroid",
            // "zcr",
          ],
          callback: (results) => {
            const { amplitudeSpectrum, spectralFlatness } = results;
            setKeyOctaveAmplitudes(
              processAmplitudeSpectrum(amplitudeSpectrum, audioContext)
            );
          },
        });

        analyzerRef.current.start();
      }

      return () => {
        if (analyzerRef.current) {
          analyzerRef.current.stop();
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
          <div className="grid grid-cols-4 gap-2">
            <svg width={width} height={height} overflow="hidden">
              <rect
                x={0}
                y={0}
                width={width}
                height={height}
                fill={"#002233"}
              />
              {octaves.map((octave, octaveIndex) => {
                const translateValue = `${width / 2}, ${
                  height / 2 + octaveIndex * 25 - 75
                }`;
                const probablyPercussion = octave >= 6;
                const noteNameValues = Object.values(noteNames);
                const chords = [
                  ["F#", "G", "E"],
                  ["D", "F", "A"],
                  ["E", "G", "B"],
                  ["F", "A", "C"],
                  ["G", "B", "D"],
                  ["G", "B", "A"],
                  ["F#", "A", "C#"],
                ];

                return (
                  <g>
                    {chords.map((chord) => {
                      const amplitudes = chord.map(
                        (item) => keyOctaveAmplitudes[`${item}${octave}`]
                      );
                      const degrees = chord.map(
                        (item) => noteAngles[item] - 90
                      );
                      const angles = degrees.map(
                        (deg) => (deg / 360) * 2 * Math.PI
                      );
                      const coordinates = angles.map(
                        (angle) =>
                          `${Math.cos(angle) * (radius * 6)},${
                            Math.sin(angle) * (radius * 6)
                          }`
                      );
                      const coordinatesString = coordinates.join(" ");
                      const showCoords =
                        !probablyPercussion &&
                        amplitudes.every((item) => item > 25);
                      return (
                        <polygon
                          transform={`translate(${translateValue})`}
                          points={coordinatesString}
                          fill="none"
                          strokeOpacity={showCoords ? amplitudes[0] / 100 : 0}
                          stroke="white"
                        />
                      );
                    })}
                    {noteNameValues.map((note) => {
                      const degrees = noteAngles[note] - 90;
                      const angle = (degrees / 360) * 2 * Math.PI;
                      const x = Math.cos(angle) * (radius * 6);
                      const y = Math.sin(angle) * (radius * 6);

                      const amplitude =
                        keyOctaveAmplitudes[`${note}${octave}`] || 0;
                      const opacity = opacityScale(amplitude);

                      const color = d3.hsl(degrees, 0.7, 0.5);
                      const rotateValue = noteAngles[note];

                      if (probablyPercussion) {
                        return (
                          <line
                            x1={x - amplitude / 4}
                            x2={x + amplitude / 4}
                            y1={y}
                            y2={y}
                            strokeWidth={4}
                            opacity={0.6}
                            stroke="white"
                            transform={`translate(${translateValue})`}
                          />
                        );
                      } else
                        return (
                          <g>
                            <line
                              x1={x - amplitude}
                              x2={x + amplitude}
                              y1={y}
                              y2={y}
                              strokeWidth={(7 - octaveIndex) * 2}
                              opacity={0.6}
                              stroke={color}
                              transform={`
                                translate(${translateValue})
                                rotate(${rotateValue} ${x} ${y})
                              `}
                            />
                            <text
                              x={x}
                              y={y}
                              transform={`translate(${translateValue})`}
                              dy="0.3em"
                              textAnchor="middle"
                              fill="white"
                              fillOpacity={opacity}
                              fontSize={`${28 * opacity}px`}
                              fontWeight="800"
                            >
                              {`${note}${octave}`}
                            </text>
                          </g>
                        );
                    })}
                    <polygon points={``} />
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
