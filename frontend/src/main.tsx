import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Одноразовая очистка устаревших ключей авторизации
if (!localStorage.getItem('_auth_cleared')) {
  localStorage.removeItem('user')
  localStorage.removeItem('token')
  localStorage.setItem('_auth_cleared', '1')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
