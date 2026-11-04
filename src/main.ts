import { mount } from "svelte";
import "./app.css";
import Root from "./Root.svelte";

const target = document.getElementById("app");
if (!target) throw new Error("Missing #app element in index.html");

export default mount(Root, { target });
