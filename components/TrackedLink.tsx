"use client";

import type { AnchorHTMLAttributes } from "react";
import { trackEvent, type EventName } from "@/lib/analytics";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  event: EventName;
  eventProps?: Record<string, string | number | boolean>;
};

/** A plain <a> that records a custom analytics event when clicked. */
export default function TrackedLink({ event, eventProps, onClick, ...rest }: Props) {
  return (
    <a
      {...rest}
      onClick={(e) => {
        trackEvent(event, eventProps);
        onClick?.(e);
      }}
    />
  );
}
