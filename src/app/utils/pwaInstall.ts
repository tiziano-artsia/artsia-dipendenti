export const isIos = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
};

export const isInStandaloneMode = () =>
  'standalone' in window.navigator && (window.navigator as any).standalone;

export const shouldShowIosInstall = () => {
  return isIos() && !isInStandaloneMode();
};
