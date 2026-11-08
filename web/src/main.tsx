import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// Polices relevées sur la référence (palette.md) ; Cormorant reste la police du logo H MODE (touche maison).
import '@fontsource/archivo-black/400.css'
import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/cormorant-garamond/400.css'
import '@fontsource/cormorant-garamond/500.css'
import './styles/tokens.css'
import './styles/index.css'
import { FournisseurAnimations } from './state/animations'
import { FournisseurNotifications } from './design-system'
import App from './App'
import { GardeErreur } from './components/GardeErreur'
import { installerSurveillance } from './lib/supervision'

installerSurveillance()


createRoot(document.getElementById('racine')!).render(
  <StrictMode>
    <BrowserRouter>
      <FournisseurAnimations>
        <FournisseurNotifications>
          <GardeErreur>
            <App />
          </GardeErreur>
        </FournisseurNotifications>
      </FournisseurAnimations>
    </BrowserRouter>
  </StrictMode>,
)
