import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import LoginPage from './LoginPage'

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    {/* Make LoginPage the root if you want to work on it */}
    {/* <LoginPage /> */}
  </StrictMode>
);
