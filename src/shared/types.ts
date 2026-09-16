export type Action =
  | 'play' | 'pause' | 'toggle-playback'
  | 'next-track' | 'previous-track'
  | 'volume-up' | 'volume-down'
  | 'seek-forward' | 'seek-backward';

export type Capability = 'play' | 'pause' | 'next-track' | 'previous-track' | 'volume' | 'seek';
export type ResultStatus = 'ok' | 'unsupported' | 'permission-required' | 'target-gone' | 'autoplay-blocked' | 'timeout' | 'failed';

export interface TargetRef {
  tabId: number;
  frameId: number;
  documentId?: string;
  mediaId: string;
  selectedAt: number;
  mode: 'automatic' | 'fixed';
}

export interface Candidate {
  tabId: number;
  frameId: number;
  documentId?: string;
  mediaId: string;
  title: string;
  hostname: string;
  audible: boolean;
  paused: boolean;
  muted: boolean;
  volume: number;
  duration: number;
  currentTime: number;
  seekable: boolean;
  capabilities: Capability[];
  controllable: boolean;
  lastInteractionAt: number;
  updatedAt: number;
  error?: string;
}

export interface CommandRequest {
  type: 'COMMAND';
  requestId: string;
  action: Action;
  target?: TargetRef;
  amount?: number;
}

export interface CommandResult {
  type: 'COMMAND_RESULT';
  requestId: string;
  status: ResultStatus;
  state?: Partial<Candidate>;
  message?: string;
}

export interface MediaStateMessage {
  type: 'MEDIA_STATE';
  state: Omit<Candidate, 'tabId' | 'frameId' | 'title' | 'hostname'>;
  title: string;
  hostname: string;
}

export interface InteractionMessage { type: 'MEDIA_INTERACTION'; mediaId: string; at: number; }

export type BackgroundMessage =
  | { type: 'GET_STATE' }
  | { type: 'SELECT_TARGET'; target: TargetRef; fixed: boolean }
  | { type: 'REQUEST_PERMISSION'; origins: string[] }
  | CommandRequest;

export interface PopupState {
  candidates: Candidate[];
  target?: TargetRef;
  lastError?: string;
  commands: chrome.commands.Command[];
}
