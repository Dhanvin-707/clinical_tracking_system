import {
  Activity,
  FileCheck2,
  Fingerprint,
  ShieldCheck,
  Blocks,
  Users,
  Lock,
  ClipboardCheck,
  ScrollText,
} from "lucide-react";

export type Feature = {
  icon: typeof Activity;
  title: string;
  desc: string;
  colour: string;
  iconColour: string;
};

export const FEATURES: Feature[] = [
  {
    icon: FileCheck2,
    title: "Patient Management",
    desc: "Auto-ID registration with a screening → enrolled → withdrawn state machine that keeps every subject's journey auditable.",
    colour: "from-cyan-500 to-sky-500",
    iconColour: "text-cyan-400",
  },
  {
    icon: ScrollText,
    title: "Consent & E-Signatures",
    desc: "PDF consent uploads hashed with SHA-256, re-verification on demand, and e-signatures backed by password re-authentication.",
    colour: "from-violet-500 to-fuchsia-500",
    iconColour: "text-violet-400",
  },
  {
    icon: ClipboardCheck,
    title: "Protocol Workflows",
    desc: "Versioned protocols with a draft → review → approved → active → closed lifecycle, governed end to end.",
    colour: "from-rose-500 to-pink-500",
    iconColour: "text-rose-400",
  },
  {
    icon: Lock,
    title: "Immutability & Audit",
    desc: "A real SHA-256 hash chain over every critical record, plus a full audit trail you can verify at any time.",
    colour: "from-emerald-500 to-teal-500",
    iconColour: "text-emerald-400",
  },
  {
    icon: Blocks,
    title: "Roles & Access Control",
    desc: "Fine-grained RBAC across researcher, data manager, PI, regulatory, admin, lab and QA roles.",
    colour: "from-amber-500 to-orange-500",
    iconColour: "text-amber-400",
  },
  {
    icon: Activity,
    title: "Adverse Event Tracking",
    desc: "Capture, classify and escalate adverse events with state transitions that never lose the paper trail.",
    colour: "from-lime-500 to-emerald-500",
    iconColour: "text-lime-400",
  },
];

export const TRUST_BADGES = [
  { icon: ShieldCheck, colour: "text-emerald-400", label: "Role-based access control" },
  { icon: Fingerprint, colour: "text-violet-400", label: "Verified e-signatures" },
  { icon: Lock, colour: "text-cyan-400", label: "Immutable audit chain" },
  { icon: Users, colour: "text-rose-400", label: "7 team roles" },
];
