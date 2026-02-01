import { memo } from "react";
import "./WaveText.css";

export interface WaveTextProps {
  text: string;
  /** Delay between each word's animation in seconds */
  wordDelay?: number;
  className?: string;
}

export const WaveText = memo(function WaveText({
  text,
  wordDelay = 0.15,
  className = "",
}: WaveTextProps) {
  const words = text.split(" ");

  return (
    <span className={`wave-text ${className}`.trim()}>
      {words.map((word, index) => (
        <span
          key={index}
          className="inline-block"
          style={{ animationDelay: `${index * wordDelay}s` }}
        >
          {word}
          {index < words.length - 1 && "\u00A0"}
        </span>
      ))}
    </span>
  );
});
