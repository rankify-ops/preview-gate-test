import type { Metadata } from "next";
import Home from "../page";

// Staff copy of the home page: same content, never locked by PreviewGate,
// shows the preview status bar instead. Keep it out of search.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default Home;
