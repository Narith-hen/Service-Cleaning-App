import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

// Import Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css'; // Bootstrap Icons

// Import router config
import RouterConfig from './routes/router_config.jsx';

// Context providers
import { TranslationProvider } from './contexts/translation_context.jsx';
import { ThemeProvider } from './contexts/theme_context.jsx';

// Styles
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <TranslationProvider>
        <Router>
          <RouterConfig />
        </Router>
      </TranslationProvider>
    </ThemeProvider>
  );
}

export default App;





// import React from 'react';
// import ApiTester from './components/ApiTester';

// function App() {
//   return (
//     <div className="App">
//       <ApiTester />
//     </div>
//   );
// }

// export default App;