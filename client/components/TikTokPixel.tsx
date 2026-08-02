"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { TIKTOK_PIXEL_ID } from "../lib/tiktok";

/**
 * Loads the TikTok Pixel and reports each page view.
 *
 * Renders nothing at all when NEXT_PUBLIC_TIKTOK_PIXEL_ID is unset — see
 * lib/tiktok.ts — so the shop carries no third-party script until the owner
 * actually has a pixel to point it at.
 *
 * The loader below is TikTok's own bootstrap written out longhand rather than
 * pasted as the minified blob their dashboard hands you. It does the same
 * three things — stand up a command queue so ttq.track() can be called before
 * the SDK has arrived, pull events.js for this pixel id, then replay whatever
 * queued up — and being readable is worth more here than being byte-identical
 * to a snippet nobody can check.
 */
export default function TikTokPixel() {
  const pathname = usePathname();

  // The shop is a single-page app after the first load, so navigating from a
  // category to a product fires no page load and TikTok would see one view
  // for a whole session. ttq.page() on every route change is what makes the
  // funnel in Ads Manager match what people actually did.
  useEffect(() => {
    if (!TIKTOK_PIXEL_ID) return;

    try {
      window.ttq?.page();
    } catch {
      // Never worth breaking a navigation over.
    }
  }, [pathname]);

  if (!TIKTOK_PIXEL_ID) return null;

  return (
    <Script id="tiktok-pixel" strategy="afterInteractive">
      {`
        (function (w, d, t) {
          w.TiktokAnalyticsObject = t;
          var ttq = (w[t] = w[t] || []);

          ttq.methods = ["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];

          ttq.setAndDefer = function (obj, method) {
            obj[method] = function () {
              obj.push([method].concat(Array.prototype.slice.call(arguments, 0)));
            };
          };

          for (var i = 0; i < ttq.methods.length; i++) {
            ttq.setAndDefer(ttq, ttq.methods[i]);
          }

          ttq.instance = function (id) {
            var inst = ttq._i[id] || [];
            for (var j = 0; j < ttq.methods.length; j++) {
              ttq.setAndDefer(inst, ttq.methods[j]);
            }
            return inst;
          };

          ttq.load = function (id, options) {
            var url = "https://analytics.tiktok.com/i18n/pixel/events.js";

            ttq._i = ttq._i || {};
            ttq._i[id] = [];
            ttq._i[id]._u = url;
            ttq._t = ttq._t || {};
            ttq._t[id] = +new Date();
            ttq._o = ttq._o || {};
            ttq._o[id] = options || {};

            var script = d.createElement("script");
            script.type = "text/javascript";
            script.async = true;
            script.src = url + "?sdkid=" + id + "&lib=" + t;

            var first = d.getElementsByTagName("script")[0];
            first.parentNode.insertBefore(script, first);
          };

          ttq.load(${JSON.stringify(TIKTOK_PIXEL_ID)});
          ttq.page();
        })(window, document, "ttq");
      `}
    </Script>
  );
}
