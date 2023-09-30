// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounceLeading<T extends (...args: any[]) => ReturnType<T>>(callback: T, timeout = 300) {
  let timer: NodeJS.Timeout | undefined;
  return (...args: Parameters<T>) => {
    if (timer) {
      return;
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      callback(...args);
      timer = undefined;
    }, timeout);
  };
}
