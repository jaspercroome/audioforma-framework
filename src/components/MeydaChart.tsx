import * as React from "react";
import { useRef, useState, useEffect } from "npm:react";
import * as d3 from "d3";
import { default as meyda } from "meyda";

const noteNames = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
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
  const [width, height] = [800, 600];
  const audioRef = useRef(null);
  const analyzerRef = useRef(null);
  const [keyOctaveAmplitudes, setKeyOctaveAmplitudes] = useState(null);

  useEffect(() => {
    if (audioRef.current) {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const source = audioContext.createMediaElementSource(audioRef.current);
      source.connect(audioContext.destination);

      analyzerRef.current = meyda.createMeydaAnalyzer({
        audioContext: audioContext,
        source: source,
        bufferSize: 2048,
        featureExtractors: ["amplitudeSpectrum"],
        callback: (results) => {
          setKeyOctaveAmplitudes(
            processAmplitudeSpectrum(results.amplitudeSpectrum, audioContext)
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
  }, []);
  const radius = 30;
  const padding = 5;
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
            <svg width={width} height={height}>
              {octaves.map((octave, octaveIndex) => {
                const translateValue = `${width / 2}, ${
                  (octaveIndex + 1) * (radius * 2 + padding) + 50
                }`;
                console.log(keyOctaveAmplitudes);
                const octaveAmplitudes = Object.entries(keyOctaveAmplitudes)
                  .filter(([key, value]) => key.includes(octave.toString()))
                  .map(([key, value]) => value) as number[];
                const maxAmplitude = Math.max(...octaveAmplitudes);
                return (
                  <g>
                    <circle
                      cx={0}
                      cy={0}
                      r={radius * 6}
                      stroke="lightgrey"
                      opacity={maxAmplitude / 100}
                      fill="none"
                      transform={`translate(${translateValue})`}
                    />
                    {noteNames.map((note, noteIndex) => {
                      const angle =
                        (noteIndex / noteNames.length) * 2 * Math.PI;
                      const x = Math.cos(angle) * (radius * 6);
                      const y = Math.sin(angle) * (radius * 6);

                      const amplitude =
                        keyOctaveAmplitudes[`${note}${octave}`] || 0;
                      const opacity = amplitude / 100;

                      return (
                        <g>
                          <circle
                            cx={x}
                            cy={y}
                            transform={`translate(${translateValue})`}
                            r={30 * opacity}
                            fill={d3.hsl(
                              (noteIndex / noteNames.length) * 360,
                              0.7,
                              0.5
                            )}
                            fillOpacity={opacity * 0.5}
                          />
                          <text
                            x={x}
                            y={y}
                            transform={`translate(${translateValue})`}
                            dy="0.3em"
                            textAnchor="middle"
                            fill="white"
                            fillOpacity={opacity}
                            fontSize="14px"
                            fontWeight="800"
                          >
                            {`${note}${octave}`}
                          </text>
                        </g>
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
