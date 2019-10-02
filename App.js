import React from "react";
import FileDecoder from "./src/FileDecoder";
import { Buffer } from "buffer";

global.Buffer = Buffer;

const App = () => <FileDecoder />;

export default App;
