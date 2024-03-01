import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

import { firebaseConfig } from 'config';

// Initialize Firebase
const app = firebaseConfig.appId ? initializeApp(firebaseConfig) : null;

export const auth = app ? getAuth(app) : null;
