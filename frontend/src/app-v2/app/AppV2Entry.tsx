import AppV2Router from "./AppV2Router";
import { AppV2Providers } from "./providers";

export default function AppV2Entry() {
  return (
    <AppV2Providers>
      <AppV2Router />
    </AppV2Providers>
  );
}
