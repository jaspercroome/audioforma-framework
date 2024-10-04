import { default as meyda } from "meyda";

export const connectAudio = (source: any, audioContext: any) => {
  const analyzer = meyda.createMeydaAnalyzer({
    audioContext: audioContext,
    source: source,
    bufferSize: 512,
    featureExtractors: ["rms"],
    callback: (features) => {
      console.log(features);
    },
  });
  console.log(analyzer);
  analyzer.start();
};
