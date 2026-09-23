"use client";

import * as React from "react";
import { SegmentError } from "@/components/errors/segment-error";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => { console.error("[Admin sementara tidak dapat dimuat]", error); }, [error]);
  return <SegmentError error={error} reset={reset} title="Admin sementara tidak dapat dimuat" />;
}
