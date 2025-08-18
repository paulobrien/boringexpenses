import 'expo/build/Expo.fx';
import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

// Import the mobile version of the app
import App from './src/App.native';

// Register the main component
registerRootComponent(App);