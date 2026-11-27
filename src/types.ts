export type TreeMode = 'tree' | 'scatter';

export type GiftRecipient = 'mom' | 'dad';

export type DetectedGesture =
  | 'none'
  | 'move_hand'
  | 'two_hands_scatter'
  | 'two_hands_tree'
  | 'right_pinch_grab_zoom'
  | 'right_pinch_release'
  | 'fingers_down_snow'
  | 'right_thumbs_up_santa';

export interface PolaroidItem {
  id: string;
  imageUrl: string | null;
  caption: string;
  /** Natural width / height ratio of the photo area; defaults to 4/3 or 3/4 */
  aspectRatio: number;
  /** Spiral placement parameters */
  heightFraction: number;
  angle: number;
}

export interface HandGestureState {
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  detectedGesture: DetectedGesture;
  /** Normalized hand/finger offset in [-1, 1] for X and Y */
  handOffset: { x: number; y: number };
  /** Horizontal hand motion for slow tree rotation */
  horizontalMotion: number;
  /** Continuous snowfall density [0..1] driven by right-hand palm-down finger flutter (0 at all other times) */
  snowIntensity: number;
  /** Snowfall speed multiplier [0.4..3.2] driven by finger flutter frequency */
  snowSpeed: number;
  /** True only while user continuously holds right-hand thumbs-up */
  santaActive: boolean;
  handCount: number;
  handDetected: boolean;
}
