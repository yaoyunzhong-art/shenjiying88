declare module 'expo-local-authentication' {
  export type AuthenticationType = number
  export const AuthenticationType: {
    FINGERPRINT: number
    FACIAL_RECOGNITION: number
    IRIS: number
  }

  export function authenticateAsync(options?: object): Promise<{success: boolean; error?: string}>
  export function getEnrolledLevelAsync(): Promise<number>
  export function hasHardwareAsync(): Promise<boolean>
  export function isEnrolledAsync(): Promise<boolean>
  export function supportedAuthenticationTypesAsync(): Promise<number[]>
}
