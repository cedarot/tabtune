import type { Action, BackgroundMessage, CommandResult, TargetRef } from './types';

export function commandMessage(action: Action, target?: TargetRef, amount?: number): BackgroundMessage {
  return { type: 'COMMAND', requestId: crypto.randomUUID(), action, target, amount };
}

export function isCommandResult(value: unknown): value is CommandResult {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<CommandResult>;
  return v.type === 'COMMAND_RESULT' && typeof v.requestId === 'string' && typeof v.status === 'string';
}
