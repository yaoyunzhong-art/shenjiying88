declare module 'expo-camera' {
  export const Camera: any;
  export const CameraView: any;
  export const Constants: any;
  export function getPermissionsAsync(): Promise<any>;
  export function requestPermissionsAsync(): Promise<any>;
  export function getCameraPermissionsAsync(): Promise<any>;
  export function requestCameraPermissionsAsync(): Promise<any>;
  export function getMicrophonePermissionsAsync(): Promise<any>;
  export function requestMicrophonePermissionsAsync(): Promise<any>;
}
