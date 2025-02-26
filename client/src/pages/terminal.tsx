import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Terminal() {
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState<string[]>([]);

  const sendCommand = async () => {
    try {
      const res = await fetch("/api/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });
      const data = await res.text();
      setOutput((prev) => [...prev, `> ${command}`, data]);
      setCommand("");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6">
      <Card className="w-full">
        <div className="p-4 bg-black text-green-400 font-mono h-[600px] overflow-auto">
          {output.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
        <div className="p-4 border-t flex gap-2">
          <Input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendCommand()}
            placeholder="Enter command..."
            className="font-mono"
          />
          <Button onClick={sendCommand}>Send</Button>
        </div>
      </Card>
    </div>
  );
}
