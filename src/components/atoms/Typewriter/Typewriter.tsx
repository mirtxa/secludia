import { useEffect, useState } from "react";
import { TypePhase, TypewriterTextProps } from "./Typewriter.types";
import { getNextStep } from "./Typewriter.utils";
import "./Typewriter.styles.css";

export const Typewriter: React.FC<TypewriterTextProps> = ({
  phrases = [],
  typingSpeed = 90,
  deletingSpeed = 50,
  pauseDuration = 1200,
  jitter = 30,
}) => {
  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<TypePhase>(TypePhase.Typing);

  useEffect(() => {
    if (!phrases.length) return;

    const phrase = phrases[index];
    const { nextText, nextPhase, delay, nextIndex } = getNextStep({
      text,
      phrase,
      phase,
      typingSpeed,
      deletingSpeed,
      pauseDuration,
      jitter,
      index,
      phrasesLength: phrases.length,
    });

    const timeout = setTimeout(() => {
      setText(nextText);
      setPhase(nextPhase);
      setIndex(nextIndex);
    }, delay);

    return () => clearTimeout(timeout);
  }, [
    text,
    index,
    phase,
    phrases,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    jitter,
  ]);

  return (
    <div>
      {text}
      <span className="typewriter-cursor">|</span>
    </div>
  );
};
