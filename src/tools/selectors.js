export const INTERACTIVE_SELECTOR = 'a, button, input, textarea, select, [role="button"], [role="link"], [role="tab"], [onclick], [tabindex]:not([tabindex="-1"])';

export const INPUT_SELECTOR = 'input, textarea, [contenteditable="true"], [role="textbox"]';

export function getInteractiveSelector() {
  return INTERACTIVE_SELECTOR;
}

export function getInputSelector() {
  return INPUT_SELECTOR;
}