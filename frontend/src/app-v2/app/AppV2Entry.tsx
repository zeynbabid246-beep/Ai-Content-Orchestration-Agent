import AppV2Router from "./AppV2Router";
import { AppV2Providers } from "./providers";
import { ErrorBoundary } from "../shared/ui/ErrorBoundary";


export default function AppV2Entry() {
  return (
    <AppV2Providers>
      <ErrorBoundary>
        <AppV2Router />
      </ErrorBoundary>
    </AppV2Providers>
  );
}
