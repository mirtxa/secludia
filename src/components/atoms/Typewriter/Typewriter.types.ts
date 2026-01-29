export enum TypePhase {
  Typing = 'typing',
  Pausing = 'pausing',
  Deleting = 'deleting',
}

export interface TypewriterTextProps {
  phrases?: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  jitter?: number;
}
