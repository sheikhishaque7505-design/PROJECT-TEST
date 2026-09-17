import React, { useRef } from "react";
import SmartCity3D from "./SmartCity3D.jsx";

export default function App() {
  const r = useRef(null);
  return <SmartCity3D ref={r} />;
}
