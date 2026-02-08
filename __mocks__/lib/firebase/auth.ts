// Mock lib/firebase/auth
export const onAuthChange = jest.fn(() => jest.fn());
export const registerParent = jest.fn().mockResolvedValue('mock-family-id');
export const loginParent = jest.fn().mockResolvedValue(undefined);
export const signOut = jest.fn().mockResolvedValue(undefined);
export const getFamilyDoc = jest.fn().mockResolvedValue(null);
export const verifyChildPin = jest.fn().mockResolvedValue(false);
