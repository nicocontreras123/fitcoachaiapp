/**
 * Shared types for timer components
 */

// Timer phases
export type TimerPhase = 'preview' | 'idle' | 'preparing' | 'warmup' | 'workout' | 'cooldown' | 'finished';

// Workout types
export type WorkoutType = 'gym' | 'boxing' | 'running';

// Exercise structure
export interface Exercise {
    name: string;
    description: string;
    duration?: number; // For boxing/running
    sets?: number; // For gym
    reps?: number | string; // For gym
    weight?: string; // For gym
}

// Warmup/Cooldown structure
export interface PhaseExercise {
    name: string;
    duration: number;
    description: string;
}

// Round structure for boxing
export interface RoundStructure {
    roundNumber: number;
    workTime: number;
    restTime: number;
    exercises?: Exercise[];
}

// Timer state
export interface TimerState {
    phase: TimerPhase;
    isActive: boolean;
    isPaused: boolean;

    // Workout specific
    currentExerciseIndex: number;
    currentSet: number;
    completedSets: Record<number, number>;

    // Boxing specific
    currentRound: number;
    totalRounds: number;
    isRest: boolean;

    // Phase timing
    phaseTimeLeft: number;
    totalTimeRemaining: number;
}

// Timer actions for reducer
export type TimerAction =
    | { type: 'START_TIMER' }
    | { type: 'PAUSE_TIMER' }
    | { type: 'RESUME_TIMER' }
    | { type: 'RESET_TIMER' }
    | { type: 'TRANSITION_PHASE'; payload: { phase: TimerPhase } }
    | { type: 'TICK'; payload: { timeLeft: number } }
    | { type: 'COMPLETE_SET' }
    | { type: 'SKIP_REST' }
    | { type: 'NEXT_EXERCISE' }
    | { type: 'PREVIOUS_EXERCISE' }
    | { type: 'NEXT_ROUND' }
    | { type: 'START_REST' }
    | { type: 'END_REST' };

// Audio configuration
export interface AudioConfig {
    voiceEnabled: boolean;
    timerSoundEnabled: boolean;
    language: string;
}

// Phase transition event
export interface PhaseTransition {
    from: TimerPhase;
    to: TimerPhase;
    timestamp: number;
}

// Timer controls interface
export interface TimerControls {
    play: () => void;
    pause: () => void;
    reset: () => void;
    skip: () => void;
    previous: () => void;
}

// Timer configuration
export interface TimerConfig {
    workoutType: WorkoutType;
    prepTime?: number;
    audioConfig?: AudioConfig;

    // Gym specific
    exercises?: Exercise[];
    warmup?: PhaseExercise[];
    cooldown?: PhaseExercise[];

    // Boxing specific
    rounds?: RoundStructure[];
    roundDuration?: number;
    restDuration?: number;
}
