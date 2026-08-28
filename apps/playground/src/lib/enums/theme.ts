enum Theme {
  System = "system",
  Light = "light",
  Dark = "dark",
}

function parseTheme(value: string | undefined | null): Theme {
  return Object.values(Theme).includes(value as Theme)
    ? (value as Theme)
    : Theme.System;
}

export { parseTheme, Theme };
