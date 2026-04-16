export interface TooltipViewportClampOptions {
  safeGap?: number;
  cssVarName?: `--${string}`;
}

export interface TooltipViewportClampBindOptions
  extends TooltipViewportClampOptions {
  tooltipEl: HTMLElement;
  triggerEl?: HTMLElement | null;
}

export type TooltipHorizontalAlign = "left" | "center" | "right";

const DEFAULT_SAFE_GAP = 16;
const DEFAULT_CSS_VAR_NAME = "--tooltip-shift-x";
const DEFAULT_OPTIONS = {
  safeGap: DEFAULT_SAFE_GAP,
  cssVarName: DEFAULT_CSS_VAR_NAME,
} satisfies Required<TooltipViewportClampOptions>;

let configuredOptions: Required<TooltipViewportClampOptions> | null = null;

function assertConfigured(): Required<TooltipViewportClampOptions> {
  if (!configuredOptions) {
    throw new Error(
      "[tooltip-viewport-clamp] setTooltipViewportClampDefaults(options)를 먼저 호출해야 합니다.",
    );
  }

  return configuredOptions;
}

function resolveOptions(
  options?: TooltipViewportClampOptions,
): Required<TooltipViewportClampOptions> {
  const defaults = assertConfigured();
  return {
    safeGap: options?.safeGap ?? defaults.safeGap,
    cssVarName: options?.cssVarName ?? defaults.cssVarName,
  };
}

export function setTooltipViewportClampDefaults(
  options: TooltipViewportClampOptions,
): void {
  configuredOptions = {
    safeGap: options.safeGap ?? DEFAULT_OPTIONS.safeGap,
    cssVarName: options.cssVarName ?? DEFAULT_OPTIONS.cssVarName,
  };
}

export function resetTooltipViewportClampDefaults(): void {
  configuredOptions = null;
}

export function getTooltipViewportClampDefaults(): Readonly<
  Required<TooltipViewportClampOptions>
> {
  return { ...assertConfigured() };
}

export function getTooltipViewportClampAlignClass(
  align: TooltipHorizontalAlign,
  options?: Pick<TooltipViewportClampOptions, "cssVarName">,
): string {
  const cssVarName = options?.cssVarName ?? assertConfigured().cssVarName;

  if (align === "left") {
    return `left-0 translate-x-[var(${cssVarName})]`;
  }

  if (align === "center") {
    return `left-1/2 translate-x-[calc(-50%_+_var(${cssVarName}))]`;
  }

  return `right-0 translate-x-[var(${cssVarName})]`;
}

function getViewportWidth(): number {
  return window.visualViewport?.width ?? window.innerWidth;
}

function clampShiftX(rect: DOMRect, safeGap: number, viewportWidth: number) {
  const minX = safeGap;
  const maxX = viewportWidth - safeGap;

  if (rect.left < minX) {
    return minX - rect.left;
  }

  if (rect.right > maxX) {
    return maxX - rect.right;
  }

  return 0;
}

export function getTooltipShiftX(
  tooltipEl: HTMLElement,
  options?: TooltipViewportClampOptions,
): number {
  const resolvedOptions = resolveOptions(options);
  const rect = tooltipEl.getBoundingClientRect();
  const viewportWidth = getViewportWidth();

  return clampShiftX(rect, resolvedOptions.safeGap, viewportWidth);
}

export function applyTooltipViewportClamp(
  tooltipEl: HTMLElement,
  options?: TooltipViewportClampOptions,
): void {
  const resolvedOptions = resolveOptions(options);
  const cssVarName = resolvedOptions.cssVarName;
  tooltipEl.style.setProperty(cssVarName, "0px");

  window.requestAnimationFrame(() => {
    const shiftX = getTooltipShiftX(tooltipEl, resolvedOptions);
    tooltipEl.style.setProperty(cssVarName, `${shiftX}px`);
  });
}

export function bindTooltipViewportClamp(
  options: TooltipViewportClampBindOptions,
) {
  const tooltipEl = options.tooltipEl;
  const triggerEl = options.triggerEl ?? tooltipEl.parentElement;

  const update = () => applyTooltipViewportClamp(tooltipEl, options);

  triggerEl?.addEventListener("mouseenter", update);
  triggerEl?.addEventListener("focusin", update);
  triggerEl?.addEventListener("touchstart", update, { passive: true });
  window.addEventListener("resize", update);

  return {
    update,
    destroy: () => {
      triggerEl?.removeEventListener("mouseenter", update);
      triggerEl?.removeEventListener("focusin", update);
      triggerEl?.removeEventListener("touchstart", update);
      window.removeEventListener("resize", update);
    },
  };
}
