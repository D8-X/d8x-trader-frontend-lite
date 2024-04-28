import { useAtomValue } from 'jotai';
import { ToastContainer } from 'react-toastify';

import { enabledDarkModeAtom } from 'store/app.store';

export const ToastContainerWrapper = () => {
  const enabledDarkMode = useAtomValue(enabledDarkModeAtom);

  return <ToastContainer position="top-left" autoClose={10_000} theme={enabledDarkMode ? 'dark' : 'light'} />;
};
