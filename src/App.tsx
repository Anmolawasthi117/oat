import { Button } from './components/ui';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui';
import { APP } from './config/constants';
import logoImg from './assets/logo.png';

function App() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-8"
      style={{ backgroundColor: 'var(--color-oat-cream)' }}
    >
      <div className="max-w-3xl w-full space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <img 
            src={logoImg} 
            alt={APP.NAME} 
            className="w-32 h-32 mx-auto rounded-full shadow-lg"
          />
          <h1 
            className="text-6xl font-bold"
            style={{
              fontFamily: 'var(--font-heading)',
              color: 'var(--color-espresso)',
            }}
          >
            {APP.NAME}
          </h1>
          <p 
            className="text-2xl italic"
            style={{
              fontFamily: 'var(--font-heading)',
              color: 'var(--color-warm-grey)',
            }}
          >
            {APP.TAGLINE}
          </p>
        </div>

        {/* Welcome Card */}
        <Card className="text-center">
          <CardHeader>
            <CardTitle>Welcome to {APP.FULL_NAME}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-6">
              Your privacy-first, browser-based photo organizer. 
              Powered by AI, but all processing happens on your device.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="primary" size="lg">
                Get Started
              </Button>
              <Button variant="secondary" size="lg">
                Learn More
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card hover>
            <CardHeader>
              <CardTitle className="text-xl">🔒 Private</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Your photos never leave your device. All processing happens locally.
              </p>
            </CardContent>
          </Card>

          <Card hover>
            <CardHeader>
              <CardTitle className="text-xl">⚡ Fast</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                WebAssembly + Web Workers = blazing-fast AI at 60fps.
              </p>
            </CardContent>
          </Card>

          <Card hover>
            <CardHeader>
              <CardTitle className="text-xl">🎨 Beautiful</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                A calm, tactile experience. Scrapbooking, not data entry.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <p 
          className="text-center text-sm"
          style={{ color: 'var(--color-warm-grey)' }}
        >
          Version {APP.VERSION} • Built with ❤️ for privacy
        </p>
      </div>
    </div>
  );
}

export default App;

