export type ComposingLike = {
  isComposing?: boolean;
  nativeEvent?: { isComposing?: boolean };
};

export type KeyboardEventLike = ComposingLike & {
  key?: string;
  code?: string;
  shiftKey?: boolean;
};

export interface EnterHandlerEventLike extends KeyboardEventLike {
  preventDefault?: () => void;
}

export interface EnterHandlerOptions {
  preventDefault?: boolean;
  allowShiftEnter?: boolean;
}

export function isComposingIME(event: ComposingLike): boolean {
  return event.nativeEvent?.isComposing ?? event.isComposing ?? false;
}

export function isEnterKey(event: KeyboardEventLike): boolean {
  return event.key === "Enter" || event.code === "Enter";
}

export function isEnterKeyWithoutComposing(
  event: KeyboardEventLike,
  options?: { allowShiftEnter?: boolean },
): boolean {
  if (!isEnterKey(event) || isComposingIME(event)) {
    return false;
  }

  if (event.shiftKey && !options?.allowShiftEnter) {
    return false;
  }

  return true;
}

export function createEnterKeySubmitHandler<TEvent extends EnterHandlerEventLike>(
  onSubmit: () => void,
  options?: EnterHandlerOptions,
): (event: TEvent) => void {
  const shouldPreventDefault = options?.preventDefault ?? true;

  return (event: TEvent) => {
    if (!isEnterKeyWithoutComposing(event, { allowShiftEnter: options?.allowShiftEnter })) {
      return;
    }

    if (shouldPreventDefault) {
      event.preventDefault?.();
    }

    onSubmit();
  };
}
