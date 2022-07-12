import '@blueprintjs/core/lib/css/blueprint.css'
import '@blueprintjs/icons/lib/css/blueprint-icons.css'
import '@blueprintjs/popover2/lib/css/blueprint-popover2.css'
import '@blueprintjs/select/lib/css/blueprint-select.css'
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'
import 'normalize.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Route, Routes } from 'react-router-dom'
import { App } from './App'
import { AppLayout } from './layouts/AppLayout'
import { NotFoundPage } from './pages/404'
import { AccountActivatePage } from './pages/account/activate'
import { IndexPage } from './pages/index'
import './styles/index.css'

Sentry.init({
  dsn: 'https://0a2bb44996194bb7aff8d0e32dcacb55@o1299554.ingest.sentry.io/6545242',
  integrations: [new BrowserTracing()],
  tracesSampleRate: 0.05,
  enabled: import.meta.env.PROD,
  beforeSend: (event, hint) => {
    if (import.meta.env.DEV) return null
    return event
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App>
      <AppLayout>
        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/account/activation" element={<AccountActivatePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppLayout>
    </App>
  </React.StrictMode>,
)
