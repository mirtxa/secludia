import { TypePhase } from "./Typewriter.types";

export const randomDelay = (base: number, jitter: number) =>
  Math.max(20, base + (Math.random() * jitter * 2 - jitter));

export interface TypeStepParams {
  text: string;
  phrase: string;
  phase: TypePhase;
  typingSpeed: number;
  deletingSpeed: number;
  pauseDuration: number;
  jitter: number;
  index: number;
  phrasesLength: number;
}

export const getNextStep = ({
  text,
  phrase,
  phase,
  typingSpeed,
  deletingSpeed,
  pauseDuration,
  jitter,
  index,
  phrasesLength,
}: TypeStepParams) => {
  switch (phase) {
    case TypePhase.Typing: {
      const next = phrase.slice(0, text.length + 1);
      const nextPhase = next === phrase ? TypePhase.Pausing : TypePhase.Typing;
      return {
        nextText: next,
        nextPhase,
        delay: randomDelay(typingSpeed, jitter),
        nextIndex: index,
      };
    }
    case TypePhase.Pausing:
      return {
        nextText: text,
        nextPhase: TypePhase.Deleting,
        delay: pauseDuration,
        nextIndex: index,
      };
    case TypePhase.Deleting: {
      const next = phrase.slice(0, text.length - 1);
      const nextPhase = next.length === 0 ? TypePhase.Typing : TypePhase.Deleting;
      const nextIndex = next.length === 0 ? (index + 1) % phrasesLength : index;
      return {
        nextText: next,
        nextPhase,
        delay: randomDelay(deletingSpeed, jitter * 0.6),
        nextIndex,
      };
    }
  }
};
