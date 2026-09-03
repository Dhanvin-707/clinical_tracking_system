"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FormBuilder from "@/components/edc/FormBuilder";

export default function FormBuilderSelect({
  protocols,
}: {
  protocols: { id: string; title: string }[];
}) {
  const [protocolId, setProtocolId] = useState(protocols[0]?.id ?? "");

  if (protocols.length === 1) {
    return <FormBuilder protocolId={protocols[0].id} />;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="protocol">Protocol</Label>
        <Select value={protocolId} onValueChange={(v) => setProtocolId(v ?? "")}>
          <SelectTrigger id="protocol" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {protocols.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {protocolId && <FormBuilder protocolId={protocolId} />}
    </div>
  );
}
