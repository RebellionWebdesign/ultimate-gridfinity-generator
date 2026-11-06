import { mount } from "svelte";
import "./app.css";
import Root from "./Root.svelte";

const target = document.getElementById("app");
if (!target) throw new Error("Missing #app element in index.html");

// The landing page also arrives pre-rendered in the HTML, for crawlers and link previews;
// the app takes over by replacing it.
if (target.hasAttribute("data-prerendered")) target.replaceChildren();

export default mount(Root, { target });
