import React, { useEffect, useState } from "react";

export default function ApiTest() {
  const [result, setResult] = useState("Consultando...");

  useEffect(() => {
    async function test() {
      try {
        let output = "";

        output += "\n=== DATASET dmgg-8hin ===\n\n";

        const r1 = await fetch(
          "https://www.datos.gov.co/resource/dmgg-8hin.json?$limit=1"
        );

        const j1 = await r1.json();

        output += JSON.stringify(j1, null, 2);

        output += "\n\nCOLUMNAS:\n";

        output += JSON.stringify(
          Object.keys(j1[0] || {}),
          null,
          2
        );

        output += "\n\n========================\n\n";

        output += "\n=== DATASET p6dx-8zbt ===\n\n";

        const r2 = await fetch(
          "https://www.datos.gov.co/resource/p6dx-8zbt.json?$limit=1"
        );

        const j2 = await r2.json();

        output += JSON.stringify(j2, null, 2);

        output += "\n\nCOLUMNAS:\n";

        output += JSON.stringify(
          Object.keys(j2[0] || {}),
          null,
          2
        );

        setResult(output);
      } catch (err) {
        setResult("ERROR:\n\n" + err.message);
      }
    }

    test();
  }, []);

  return (
    <div
      style={{
        padding: "20px",
        background: "#111",
        color: "#0f0",
        minHeight: "100vh",
        whiteSpace: "pre-wrap",
        fontFamily: "monospace"
      }}
    >
      {result}
    </div>
  );
}