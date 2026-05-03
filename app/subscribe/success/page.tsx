import { Suspense } from "react";
import SuccessClient from "./success-client";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-5 py-20 text-center text-sm text-zinc-300">
          결제 처리 중...
        </main>
      }
    >
      <SuccessClient />
    </Suspense>
  );
}
