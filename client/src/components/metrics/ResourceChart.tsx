import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { type Metric } from "@shared/schema";

interface Props {
  data: Metric;
}

export default function ResourceChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={[data]}>
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="cpuLoad" stroke="#8884d8" />
        <Line type="monotone" dataKey="memoryUsed" stroke="#82ca9d" />
      </LineChart>
    </ResponsiveContainer>
  );
}
