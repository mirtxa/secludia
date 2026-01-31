import { memo, useEffect, useState, useRef } from "react";
import type { TypewriterTextProps } from "./Typewriter.types";
import { TypePhase } from "./Typewriter.types";
import { getNextStep } from "./Typewriter.utils";
import "./Typewriter.css";

export const Typewriter = memo(function Typewriter({
  phrases = [],
  typingSpeed = 90,
  deletingSpeed = 50,
  pauseDuration = 1200,
  jitter = 30,
}: TypewriterTextProps) {
  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<TypePhase>(TypePhase.Typing);

  // Store config in ref to avoid effect dependencies
  const configRef = useRef({ typingSpeed, deletingSpeed, pauseDuration, jitter });
  const phrasesRef = useRef(phrases);

  // Update refs in effect to avoid updating during render
  useEffect(() => {
    configRef.current = { typingSpeed, deletingSpeed, pauseDuration, jitter };
  }, [typingSpeed, deletingSpeed, pauseDuration, jitter]);

  useEffect(() => {
    phrasesRef.current = phrases;
  }, [phrases]);

  useEffect(() => {
    const currentPhrases = phrasesRef.current;
    if (!currentPhrases.length) return;

    const config = configRef.current;
    const phrase = currentPhrases[index];
    const { nextText, nextPhase, delay, nextIndex } = getNextStep({
      text,
      phrase,
      phase,
      typingSpeed: config.typingSpeed,
      deletingSpeed: config.deletingSpeed,
      pauseDuration: config.pauseDuration,
      jitter: config.jitter,
      index,
      phrasesLength: currentPhrases.length,
    });

    const timeout = setTimeout(() => {
      setText(nextText);
      setPhase(nextPhase);
      setIndex(nextIndex);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, index, phase]);

  return (
    <span>
      {text}
      <span className="typewriter-cursor">|</span>
    </span>
  );
});
