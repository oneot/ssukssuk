const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

/** Escapes text for `set:html` and turns its line breaks into <br />. */
export const withLineBreaks = (text: string) => text.split('\n').map(escapeHtml).join('<br />');
