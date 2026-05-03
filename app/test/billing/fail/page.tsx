import { Suspense } from "react";
import FailClient from "./fail-client";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-5 py-20 text-center">
          <p className="text-sm text-zinc-300">로딩...</p>
        </main>
      }
    >
      <FailClient />
    </Suspense>
  );
}
