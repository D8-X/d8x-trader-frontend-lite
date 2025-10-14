// eslint-disable-next-line
export const isUserRejectedError = (error: any) => {
  const stringError = JSON.stringify(error);
  return stringError.includes('User rejected the request');
};

// eslint-disable-next-line
export const isInsufficientFundsError = (error: any) => {
  const stringError = JSON.stringify(error);
  return stringError.includes('insufficient funds');
};
