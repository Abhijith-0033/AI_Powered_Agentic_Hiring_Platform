import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'

/**
 * Main App component - wraps the entire application with routing
 */
function App() {
    return (
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    )
}

export default App
