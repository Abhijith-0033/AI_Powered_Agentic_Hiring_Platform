import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import { AuthProvider } from './contexts/AuthContext'
import ChatbotWidget from './components/chatbot/ChatbotWidget'

/**
 * Main App component - wraps the entire application with routing and authentication
 */
function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
                <ChatbotWidget />
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App
