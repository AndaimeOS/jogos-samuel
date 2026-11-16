import "./styles/main.css";
import { GameApp } from "./core/GameApp";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("App root not found");
new GameApp(root);
