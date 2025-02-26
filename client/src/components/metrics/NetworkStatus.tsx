import { Card, CardContent } from "@/components/ui/card";
import { type Metric } from "@shared/schema";

interface Props {
  data: Metric;
}

type InterfaceStatus = Record<string, string>;
type VPNStatus = Record<string, string>;
type WifiClient = {
  mac: string;
  hostname: string;
  signal: string;
};

export default function NetworkStatus({ data }: Props) {
  const interfaces = data.interfaces as InterfaceStatus;
  const vpnStatus = data.vpnStatus as VPNStatus;
  const wifiClients = data.wifiClients as WifiClient[];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold mb-2">Interfaces</h3>
        {Object.entries(interfaces).map(([name, status]) => (
          <div key={name} className="flex justify-between">
            <span>{name}</span>
            <span className={status === "up" ? "text-green-500" : "text-red-500"}>
              {status}
            </span>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-bold mb-2">VPN Status</h3>
        {Object.entries(vpnStatus).map(([name, status]) => (
          <div key={name} className="flex justify-between">
            <span>{name}</span>
            <span className={status === "connected" ? "text-green-500" : "text-red-500"}>
              {status}
            </span>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-bold mb-2">WiFi Clients</h3>
        {wifiClients.map((client) => (
          <div key={client.mac} className="flex justify-between">
            <span>{client.hostname}</span>
            <span className="text-blue-500">{client.signal}</span>
          </div>
        ))}
      </div>
    </div>
  );
}