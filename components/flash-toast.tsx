"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const messages: Record<string, string> = {
  welcome: "Signed in successfully.", saved: "Changes saved.", created: "Record created.", deleted: "Record removed.", deactivated: "Referenced record was deactivated.",
};

export function FlashToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const code = searchParams.get("flash");
  const [visible, setVisible] = useState(Boolean(code && messages[code]));

  useEffect(() => {
    if (!code || !messages[code]) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete("flash");
    router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
    const timer = window.setTimeout(() => setVisible(false), 4000);
    return () => window.clearTimeout(timer);
  }, [code, pathname, router, searchParams]);

  return visible && code && messages[code] ? <div className="toast" role="status" aria-live="polite">{messages[code]}</div> : null;
}
