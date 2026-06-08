import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
}

export function generateId(prefix = "id"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getDifficultyColor(d: string): string {
  if (d === "easy") return "text-brand-green bg-green-500/10";
  if (d === "hard") return "text-brand-red bg-red-500/10";
  return "text-brand-orange bg-orange-500/10";
}

export function getScoreBg(score: number): string {
  if (score >= 70) return "bg-green-500/10 text-brand-green border-green-500/30";
  if (score >= 50) return "bg-orange-500/10 text-brand-orange border-orange-500/30";
  return "bg-red-500/10 text-brand-red border-red-500/30";
}

export function truncate(str: string, len = 60): string {
  return str.length > len ? str.slice(0, len) + "…" : str;
}

// CCNA demo content (used when no PDFs uploaded)
export const DEMO_CCNA_CONTENT = `
CCNA 200-301 Study Guide — Core Topics

NETWORK FUNDAMENTALS
OSI Model (7 layers): Physical, Data Link, Network, Transport, Session, Presentation, Application
TCP/IP Model (4 layers): Network Access, Internet, Transport, Application
Protocols by layer: HTTP/HTTPS (App), TCP/UDP (Transport), IP/ICMP (Network), Ethernet (Data Link)

IPv4 ADDRESSING
Class A: 1.0.0.0–126.255.255.255, /8 default mask, 16M hosts/network
Class B: 128.0.0.0–191.255.255.255, /16 default mask, 65K hosts/network  
Class C: 192.0.0.0–223.255.255.255, /24 default mask, 254 hosts/network
Private: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
Loopback: 127.0.0.0/8

SUBNETTING
Subnets = 2^n (n = borrowed host bits)
Usable hosts = 2^h - 2 (h = remaining host bits)
/24 = 255.255.255.0 → 254 hosts
/25 = 255.255.255.128 → 2 subnets, 126 hosts each
/26 = 255.255.255.192 → 4 subnets, 62 hosts each
/27 = 255.255.255.224 → 8 subnets, 30 hosts each
/28 = 255.255.255.240 → 16 subnets, 14 hosts each
/30 = 255.255.255.252 → point-to-point links, 2 hosts

ROUTING
Static: ip route [dest] [mask] [next-hop]
Default: ip route 0.0.0.0 0.0.0.0 [next-hop]
Administrative distances: Connected=0, Static=1, EIGRP=90, OSPF=110, RIP=120, External EIGRP=170, Unknown=255

OSPF
Type: Link-state, uses Dijkstra SPF algorithm
AD: 110, Multicast: 224.0.0.5 (all routers), 224.0.0.6 (DR/BDR)
Hello: 10s (point-to-point), 30s (NBMA); Dead: 4x hello
DR/BDR election: highest priority (default 1), then highest router-id
Commands: router ospf [pid], network [net] [wildcard] area [id], show ip ospf neighbor

EIGRP
Type: Hybrid (distance vector + link-state features), Cisco proprietary
AD: 90 internal, 170 external; Uses DUAL algorithm
Metric: bandwidth + delay (by default); K values
Commands: router eigrp [AS], network [net] [wildcard], show ip eigrp neighbors

SWITCHING
VLANs: Logical broadcast domain separation
Access port: single VLAN, no tagging
Trunk port: 802.1Q tagging, multiple VLANs, native VLAN untagged (default VLAN 1)
STP: prevents loops; Root Bridge = lowest Bridge ID (priority 32768 + MAC)
Port states: Blocking → Listening → Learning → Forwarding (30-50s total)
RSTP (802.1w): converges in seconds, port roles: Root, Designated, Alternate, Backup

COMMANDS
vlan [id]; name [name]
switchport mode access; switchport access vlan [id]  
switchport mode trunk; switchport trunk allowed vlan [list]
show vlan brief; show interfaces trunk; show spanning-tree

NETWORK SECURITY
ACLs: Standard (1-99) = source only; Extended (100-199) = src+dst+protocol+port
Placement: Standard near destination, Extended near source
Direction: inbound or outbound per interface
ip access-list extended [name]; permit/deny [protocol] [src] [dst]
ip access-group [name] in|out (on interface)
Port Security: switchport port-security maximum [n]; violation shutdown|restrict|protect
AAA: RADIUS (UDP 1812/1813), TACACS+ (TCP 49, full encryption)

NETWORK SERVICES
DHCP: DORA (Discover/Offer/Request/Ack); ip helper-address for relay
DNS: UDP/TCP 53; ip domain-name, ip name-server
NAT: Static (1:1), Dynamic (pool), PAT/overload (many:1 with ports)
NTP: UDP 123; ntp server [ip]; show clock
SNMP: UDP 161 (queries), 162 (traps); v2c uses community strings, v3 encrypted
Syslog: UDP 514; severity 0-7 (0=emergency, 7=debug)

WAN
PPP: Point-to-point, supports PAP/CHAP authentication
Frame Relay: Packet-switched, DLCI numbers, LMI
MPLS: Label-switching, any-to-any, provider managed
VPN: Site-to-site (IPsec), Remote access (SSL/TLS)
SD-WAN: Software-defined, centralized control, multiple transport types
`;
