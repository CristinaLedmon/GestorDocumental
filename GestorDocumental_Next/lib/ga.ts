"use client";

import ReactGA from "react-ga4";

import { useEffect } from "react";

export default function GoogleAnalyticsInit() {
  useEffect(() => {
    ReactGA.initialize("G-MJ78KET8YV");
    ReactGA.send("pageview");
  });

  return null;
}
