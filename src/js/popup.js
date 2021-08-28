import "../css/popup.css";
import hello from "./popup/example";
import { getRules } from "./rpc";

hello();
getRules().then(console.log).catch(console.error);
