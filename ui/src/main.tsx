import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource/cormorant-garamond/400.css'
import '@fontsource/cormorant-garamond/400-italic.css'
import '@fontsource/cormorant-garamond/500.css'
import '@fontsource/jost/300.css'
import '@fontsource/jost/400.css'
import './styles/index.css'
import { FournisseurAnimations } from './state/animations'
import { FournisseurNotifications } from './design-system'
import App from './App'
import { MODE_DEMO } from './lib/catalogue'

if (MODE_DEMO) document.documentElement.style.setProperty('--demo-h', '28px')

createRoot(document.getElementById('racine')!).render(
  <StrictMode>
    <BrowserRouter>
      <FournisseurAnimations>
        <FournisseurNotifications>
          <App />
        </FournisseurNotifications>
      </FournisseurAnimations>
    </BrowserRouter>
  </StrictMode>,
)
