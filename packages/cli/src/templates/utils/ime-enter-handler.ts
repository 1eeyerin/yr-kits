export type ComposingLike = {
  isComposing?: boolean;
  nativeEvent?: { isComposing?: boolean };
};

export type KeyboardEventLike = ComposingLike & {
  key?: string;
  code?: string;
};

export interface EnterHandlerEventLike extends KeyboardEventLike {
  preventDefault?: () => void;
}

export interface EnterHandlerOptions {
  preventDefault?: boolean;
}

export function isComposingIME(event: ComposingLike): boolean {
  return event.nativeEvent?.isComposing ?? event.isComposing ?? false;
}

export function isEnterKey(event: KeyboardEventLike): boolean {
  return event.key === "Enter" || event.code === "Enter";
}

export function isEnterKeyWithoutComposing(event: KeyboardEventLike): boolean {
  return isEnterKey(event) && !isComposingIME(event);
}

export function createEnterKeySubmitHandler<TEvent extends EnterHandlerEventLike>(
  onSubmit: () => void,
  options?: EnterHandlerOptions,
): (event: TEvent) => void {
  const shouldPreventDefault = options?.preventDefault ?? true;

  return (event: TEvent) => {
    if (!isEnterKeyWithoutComposing(event)) {
      return;
    }

    if (shouldPreventDefault) {
      event.preventDefault?.();
    }

    onSubmit();
  };
}
