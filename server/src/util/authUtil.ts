
const verifyApiKey = (key?: string): boolean => {
    return key === process.env.API_KEY;
  };

export {verifyApiKey}