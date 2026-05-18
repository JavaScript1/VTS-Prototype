import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import VTSSystem from "./pages/VTSSystem";
import OperationsSupport from "./pages/OperationsSupport";
import TrafficRiskAwareness from "./pages/TrafficRiskAwareness";
import ComplianceSupport from "./pages/ComplianceSupport";
import EmergencyResponse from "./pages/EmergencyResponse";


function Router() {
  return (
    <Switch>
      <Route path={"\\"} component={VTSSystem} />
      <Route path="/operations" component={OperationsSupport} />
      <Route path="/traffic-risk" component={TrafficRiskAwareness} />
      <Route path="/compliance" component={ComplianceSupport} />
      <Route path="/emergency" component={EmergencyResponse} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
